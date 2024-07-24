import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import bcrypt from 'bcrypt';
import { MailService } from 'src/modules/mail/mail.service';
import UserMailReachLimitException from 'src/errors/UserMailReachLimitException';
import { ResetPasswordDto } from 'src/modules/auth/dtos/ResetPassword.dto';
import { UpdatePasswordDto } from 'src/modules/auth/dtos/UpdatePassword.dto';
import { CreateUserDto } from './dtos/CreateUser.dto';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private mailService: MailService
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email: email });
  }


  async create(userData: CreateUserDto, isFromGoogle: boolean = false): Promise<User> {
    const user = this.usersRepository.create(userData);

    if (userData.password) {
      let salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS))
      user.password = await bcrypt.hash(user.password, salt);  
    }

    let verificationSalt = await bcrypt.genSalt(1);

    if (isFromGoogle) {
      user.isVerified = true;
    } else {
      user.verificationCode = await bcrypt.hash(Math.random().toString(), verificationSalt);
    }

    user.tokenVersion = await bcrypt.hash(Math.random().toString(), verificationSalt);

      let result = await this.usersRepository.save(user);

      if (result && !isFromGoogle) {
        try {
          await this.sendVerificationEmail(result);
        } catch (error) {
          console.error(error);
        }
      }

      return result;
  }

  async update(user, data) {
    for (let prop in data) {
      user[prop] = data[prop];
    }
      
    return await this.usersRepository.save(user);
  }

  canSendMail(user: User) {
    return user.lastMailSent == null || user.timeLeftToSendMail() < 0 ;
  }

  async sendVerificationEmail(user: User) {
    if (this.canSendMail(user)) {
      await this.sendUserConfirmationMail(user);
      await this.updateUserAndUserMailSent(user)
    } else {
      throw new UserMailReachLimitException(user);
    }
  }

  async sendPasswordResetMail(email: string) {
    let user = await this.findOneByEmail(email);

    if (this.canSendMail(user)) {
      let verificationSalt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS));
      user.passwordResetCode = await bcrypt.hash(Math.random().toString(), verificationSalt);
      user.passwordResetTime = new Date();

      await this.updateUserAndUserMailSent(user);
      await this.sendUserPasswordResetMail(user);
    } else {
      throw new UserMailReachLimitException(user);
    }
  }

  getBaseUrl() {

    let https = "https";

    if (process.env.NODE_ENV == "development") {
      https = "http";
    }

    return https + '://' +process.env.BASE_URL;
  }

  async sendUserConfirmationMail(user: User) {
    const url = `${this.getBaseUrl()}/auth/confirm_user_email?code=${encodeURIComponent(user.verificationCode)}&email=${encodeURIComponent(user.email)}`;
    

    await this.mailService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Welcome to Image Approval! Please Confirm your Email',
      template: './userEmailConfirmation', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content
        name: user.name,
        url,
      },
    });
  }

  async sendUserPasswordResetMail(user: User) {
    const url = `${this.getBaseUrl()}/reset-password/${encodeURIComponent(user.passwordResetCode)}/${encodeURIComponent(user.email)}`;
    

    await this.mailService.sendMail({
      to: user.email,
      subject: 'Your password reset request',
      template: './userPasswordReset',
      context: {
        name: user.name,
        url,
      },
    });
  }

  

  async updateUserAndUserMailSent(user: User) {
    user.lastMailSent = new Date();
    await this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async getUser(userId) {
    return await this.usersRepository.findOneBy({ id: userId });
  }

  async confirmUserEmail(email: string, code: string) {
    let user = await this.findOneByEmail(email);

    if (user.isVerified) {
      return true;
    }

    if (user.verificationCode != code) {
      return false;
    }

    user.setAsVerified();

    return true;
  }

  async updateUserPasswordFromMail(data: ResetPasswordDto) {
    let user: User = await this.findOneByEmail(data.email);

    if (data.passwordResetCode != user.passwordResetCode) {
      throw new BadRequestException({ errors: {
        password: ['Invalid password reset code, Please check your email for a newer reset password email'],
      }});
    }

    if (user.timeLeftToResetPassword() <= 0) {
      throw new BadRequestException({ errors: {
        password: ['Reset password time limit reached, Please request for a new password reset code'],
      }});
    }

    await this.updateUserPassword(user, data.password);

    return true;
  }

  async updateUserPasswordFromProfile(user: User, data: UpdatePasswordDto) {
    if (user.password) {
      if (!data.oldPassword || data.oldPassword == '') {
        throw new BadRequestException({ errors: {
          oldPassword: ['Incorrect password'],
        }});
      }

      const match = await user.isPasswordMatches(data.oldPassword);

      if (!match) {
        throw new BadRequestException({ errors: {
          oldPassword: ['Incorrect password'],
        }});
      }
    }
    await this.updateUserPassword(user, data.newPassword);

    return true;
  }

  async updateUserPassword(user: User, password: string) {
    let salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS));
    user.password = await bcrypt.hash(password, salt);

    let verificationSalt = await bcrypt.genSalt(1);
    user.tokenVersion = await bcrypt.hash(Math.random().toString(), verificationSalt);
    user.passwordResetCode = null;
    user.passwordResetTime = null;
    user.failedLoginAttempts = 0;

    return await this.usersRepository.save(user);
  }

  async resendVerificationEmail(user: User) {
    if (user.isVerified) {
      throw new BadRequestException({ errors: {
        email: ['User is already verified'],
      }});
    }

    if (!this.canSendMail(user)) {
      throw new UserMailReachLimitException(user);
    }

    await this.sendUserConfirmationMail(user);
    await this.updateUserAndUserMailSent(user);
  }  
}

