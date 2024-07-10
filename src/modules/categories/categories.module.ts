import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), RedisModule],
  controllers: [CategoriesController],
  exports: [CategoriesService],
  providers: [CategoriesService],
})
export class CategoriesModule {}
