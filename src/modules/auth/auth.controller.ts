import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Query,
    Request,
    Res,
    UnauthorizedException,
    UseGuards
  } from '@nestjs/common';
  import { AuthGuard } from './guards/auth.guard';
  import { AuthService } from './auth.service';
  import { SignInDto } from './dtos/SignIn.dto';
  import { UsersService } from 'src/modules/users/users.service';
  import InvalidLoginException from 'src/errors/InvalidLoginException';
import { ForgotPasswordDto } from './dtos/ForgotPassword.dto';
import { ResetPasswordDto } from './dtos/ResetPassword.dto';
import { UpdatePasswordDto } from './dtos/UpdatePassword.dto';
import { GoogleLoginDto } from './dtos/GoogleLogin.dto';
  
  @Controller('auth')
  export class AuthController {
    constructor(private authService: AuthService, private usersService: UsersService) {}
  
    @HttpCode(HttpStatus.OK)
    @Post('login')
    async signIn(@Body() signInDto: SignInDto) {
      try {
        const user = await this.usersService.findOneByEmail(signInDto.email);

        return await this.authService.signIn(user, signInDto.password);
      } catch (error) {
        if (error.status === 401) {
          throw new InvalidLoginException();
        } else {
          throw error;
        }
      }
    }

    @HttpCode(HttpStatus.OK)
    @Post('google')
    async google(@Body() googleLoginDto: GoogleLoginDto) {
      return await this.authService.handleGoogleLogin(googleLoginDto.token);
    }

    @HttpCode(HttpStatus.OK)
    @Post('forgot_password')
    async forgotPassword(@Body() signInDto: ForgotPasswordDto) {
      await this.usersService.sendPasswordResetMail(signInDto.email);
      return {success: true};
    }

    @HttpCode(HttpStatus.OK)
    @Post('reset_password')
    async resetPassword(@Body() resetPasswordData: ResetPasswordDto) {
      await this.usersService.updateUserPasswordFromMail(resetPasswordData);
      return {success: true};
    }

    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('update_password')
    async updatePassword(@Request() req, @Body() updatePasswordData: UpdatePasswordDto) {
      let user = await this.usersService.findOneByEmail(req.user.email);

      await this.usersService.updateUserPasswordFromProfile(user, updatePasswordData);
      return {success: true};
    }
  
    @UseGuards(AuthGuard)
    @Get('profile')
    async getProfile(@Request() req) {
      let user = await this.usersService.findOneByEmail(req.user.email);

      if (req.user.version != user.tokenVersion) {
        throw new UnauthorizedException();
      }

      if (user.isBlocked) {
        throw new UnauthorizedException();
      }

      return {success: true, user: {...req.user, ...user.getClientData() }, access_token: await this.authService.getToken(user)};
    }

    @UseGuards(AuthGuard)
    @Post('send_verification_email')
    async resendVerificationEmail(@Request() req) {
      let user = await this.usersService.findOneByEmail(req.user.email);

      await this.usersService.resendVerificationEmail(user);

      return {success: true};
    }

    @Get('confirm_user_email')
    async confirmUserEmail(@Request() req, @Res() res, @Query('code') code: string, @Query('email') email: string) {
      let result = await this.usersService.confirmUserEmail(email, code);
      
      
      let message = 'Your email has been confirmed!';
      let type = 'success';

      if (!result) {
        type = 'error';
        message = 'Invalid confirmation code';
      }
      
      return res.redirect('/?showMessage=' + encodeURI(message) + '&type=' + type);
    }

  }
  
