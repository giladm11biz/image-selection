import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/modules/users/user.entity';
import UserLoginBlockedException from 'src/errors/UserLoginBlockedException';
import UserSuspendedException from 'src/errors/UserSuspendedException'; 
import { HttpService } from '@nestjs/axios';

const GOOGLE_GET_TOKEN_DATA_URL = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private httpService: HttpService
  ) {}

  async signIn(
    user: User,
    pass: string | null = null,
    isWithPassword: boolean = true
  ): Promise<{ success: boolean, access_token: string }> {

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.isBlocked) {
      throw new UserSuspendedException();
    }

    if (user.isLoginBlocked()) {
      throw new UserLoginBlockedException();
    }

    if (isWithPassword) {
      if (!user.password) {
        throw new UnauthorizedException();
      }

      const match = await user.isPasswordMatches(pass);

      if (!match) {
        user.updateUserFailedLoginAttempts();
        throw new UnauthorizedException();
      }
    }

    return {
      success: true,
      access_token: await this.getToken(user),
    };
  }

  async getToken(user: User): Promise<string> {
    const payload = { email: user.email, version: user.tokenVersion, id: user.id };

    return await this.jwtService.signAsync(payload);
  }

  async handleGoogleLogin(token: string) {
    let response = await this.httpService.axiosRef.get(GOOGLE_GET_TOKEN_DATA_URL + token);
    let responseUserData = response.data;

    if (!(responseUserData.email)) {
      throw new BadRequestException(response.data);
    }

    let user = await this.usersService.findOneByEmail(response.data.email);

    if (!user) {
      user = await this.usersService.create({
        email: responseUserData.email,
        name: responseUserData.name,
        mailUpdates: false,
        password: null,
        nickname: null,
      }, true);
    }

    if (!user.isVerified) {
      user.setAsVerified();
    }

    return this.signIn(user, null, false);
  }
}
