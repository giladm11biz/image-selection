import { Controller, Post, Body, Patch, UseGuards, HttpStatus, HttpCode, Request, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import _ from 'lodash';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { UpdateUserDto } from './dtos/UpdateUser.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() userData: CreateUserDto) {
    let propsToSave = ['email', 'password', 'name', 'nickname', 'mailUpdates'];
    let data = _.pick(userData, propsToSave);

    data.name = data.name.trim();

    if (data.nickname) {
      data.nickname = data.nickname.trim();

      if (data.nickname == '' || data.nickname.length == 1) {
        data.nickname = null;
      }
    }

    let user = await this.usersService.create(data);
    
    return {success: true, email: user.email};
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch()
  async updateUser(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    let propsToSave = ['name', 'nickname', 'mailUpdates'];
    let data = _.pick(updateUserDto, propsToSave);

    data.name = data.name.trim();

    if (data.nickname) {
      data.nickname = data.nickname.trim();

      if (data.nickname == '' || data.nickname.length == 1) {
        data.nickname = null;
      }
    }

    let user = await this.usersService.findOneByEmail(req.user.email);

    await this.usersService.update(user, data);
    
    return {success: true};
  }
}