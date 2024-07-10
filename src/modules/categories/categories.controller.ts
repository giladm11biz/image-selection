import { Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CategoryGuard } from './guards/category.guard';

@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Request() req) {
    return (await this.categoriesService.getCategoriesForUser(req.user)).map(category => category.getClientData());
  }

  @UseGuards(CategoryGuard)
  @Get(':id/:imageIndex')
  async getImage(@Request() req, @Param('imageIndex') imageIndex: number) {
    return await this.categoriesService.getImageByIndex(req.category, imageIndex);
  }

  @UseGuards(CategoryGuard)
  @Get(':id/:imageName')
  async getImageByName(@Request() req, @Param('imageName') imageName: string) {
    return await this.categoriesService.getImageByName(req.category, imageName);
  }

  @UseGuards(CategoryGuard)
  @Post(':id/:imageName/crop')
  async crop(@Request() req, @Param('imageName') imageName: string) {
    return await this.categoriesService.cropImage(req.category, req.user, imageName, req.body);
  }

  @UseGuards(CategoryGuard)
  @Delete(':id/:imageName')
  async deleteImage(@Request() req, @Param('imageName') imageName: string) {
    return await this.categoriesService.deleteImage(req.category, req.user, imageName);
  }

  @UseGuards(CategoryGuard)
  @Post(':id/:imageName/accept')
  async accept(@Request() req, @Param('imageName') imageName: string) {
    return await this.categoriesService.moveImageToAcceptedLocation(req.category, req.user, imageName);
  }

  @UseGuards(CategoryGuard)
  @Post(':id/undo')
  async undo(@Request() req) {
    return await this.categoriesService.undoAction(req.category, req.user);
  }
}
