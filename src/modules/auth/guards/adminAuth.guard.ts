
import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { UsersService } from 'src/modules/users/users.service';

  
  @Injectable()
  export class AdminAuthGuard extends AuthGuard {
    constructor(jwtService: JwtService, private usersService: UsersService) {
      super(jwtService);
    }
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      let isLoggedIn = await super.canActivate(context);

      if (!isLoggedIn) {
        throw new UnauthorizedException();
      }

      const request = context.switchToHttp().getRequest();


      let user = await this.usersService.findOneByEmail(request.user.email);
      
      if (!user.isAdmin) {
        throw new UnauthorizedException();
      }

      return true;
    }

  }
  