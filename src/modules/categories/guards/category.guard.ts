
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
import { CategoriesService } from '../categories.service';
import _ from 'lodash';
  
  
  @Injectable()
  export class CategoryGuard implements CanActivate {
    constructor(private readonly categoryService: CategoriesService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const params = request.params;
      const id = params.id;
      
      if (!id) {
        throw new UnauthorizedException();
      }

      let categories = (await this.categoryService.getCategoriesForUser(request.user))
                                                  .filter(category => category.id == id);


      if (!categories[0]) {
        throw new UnauthorizedException();
      }

      request['category'] = categories[0];

      return true;
    }
  }
  