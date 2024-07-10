import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import * as fs from 'fs';
import * as path from 'path';
import * as Redis from 'ioredis';
import { promisify } from 'util';
import { exec } from 'child_process';
import { User } from '../users/user.entity';
import sharp from 'sharp'; 

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private categoriesRepository: Repository<Category>,
        private redisService: RedisService
    ) {}

    async getCategoriesForUser(user: User): Promise<any[]> {
        return await this.categoriesRepository.find();
    }

    async getImageByIndex(category: Category, index: number = 0) {
        const file = fs.readdirSync(category.sourcePath)[index];
        //     .filter(file => /\.(jpg|jpeg|png|gif)$/.test(file))

        if (!file) {
            return null;
        }

        const filePath = path.join(category.sourcePath, file);
        if (!fs.existsSync(filePath)) {
            return null;
        }

        return {
            fileName: file,
            data: `data:image/png;base64,${fs.readFileSync(filePath, { encoding: 'base64' })}`
        };
    }

    async getImageByName(category: Category, name: string) {
        const fileName = path.join(category.sourcePath, name);

        return {
            fileName: name,
            data: `data:image/png;base64,${fs.readFileSync(fileName, { encoding: 'base64' })}`
        };
    }

    async addUndoAction(category: Category, user: User, actionData: any) {
        let key = 'undo_' + category.id + '_' + user.id;
        
        let undoActions = await this.redisService.get(key);

        let undoActionsArray = undoActions ? JSON.parse(undoActions) : [];

        undoActionsArray.unshift(actionData);
        undoActionsArray.splice(10);
        
        await this.redisService.set(key, JSON.stringify(undoActionsArray), 24 * 60 * 60 * 1000);
    }

    async getLastUndoAction(category: Category, user: User) {
        let key = 'undo_' + category.id + '_' + user.id;
        let undoActions = await this.redisService.get(key);

        let undoActionsArray = JSON.parse(undoActions);

        let result = undoActionsArray.shift();

        await this.redisService.set(key, JSON.stringify(undoActionsArray), 60 * 60 * 1000);

        return result;
    }

    async cropImage(category: Category, user: User, imageName: string, cropData: any): Promise<any> {
        const imagePath = path.join(category.sourcePath, imageName);
        const image = await this.getImageByName(category, imageName);
        if (!image) {
          throw new Error('Image not found in cache');
        }
    
        const outputPath = imagePath;
        const { width, height, x, y } = cropData;

        await sharp(imagePath)
          .extract({ width, height, left: x, top: y })
          .toFile(outputPath);
            

        await this.addUndoAction(category, user, { action: 'crop', image });

        return await this.getImageByName(category, imageName);
    }

    async undoCropImage(category: Category, image) {
        const {fileName, data} = image;

        const imagePath = path.join(category.sourcePath, fileName);
        
        fs.writeFileSync(imagePath, Buffer.from(data.split(',')[1], 'base64'));

        return image;
    }

    async deleteImage(category: Category, user: User, imageName: string): Promise<void> {
        const image = await this.getImageByName(category, imageName);
        const imagePath = path.join(category.sourcePath, imageName);

        if (!image) {
          throw new Error('Image not found in fs');
        }
    
        fs.unlinkSync(imagePath);

        await this.addUndoAction(category, null, { action: 'delete', image });
    }

    async undoDeleteImage(category: Category, image) {
        const {fileName, data} = image;
        const imagePath = path.join(category.sourcePath, path.basename(fileName));

        fs.writeFileSync(imagePath, Buffer.from(data.split(',')[1], 'base64'));

        return image;
    }

    async moveImageToAcceptedLocation(category: Category, user: User, imageName: string): Promise<void> {
        let imagePath = path.join(category.sourcePath, imageName);

        const destinationPath = path.join(category.destinationPath, imageName);

        fs.renameSync(imagePath, destinationPath);

        await this.addUndoAction(category, user, { action: 'move', image: imageName });    
    }

    async undoMoveImageToAcceptedLocation(category: Category, imageName) {
        const imageOriginalPath = path.join(category.sourcePath, imageName);
        const currentPath = path.join(category.destinationPath, imageName);

        fs.renameSync(currentPath, imageOriginalPath);

        return this.getImageByName(category, imageName);
    }

    async undoAction(category: Category, user: User): Promise<void> {
        const actionFunctionMap = {
          'crop': this.undoCropImage,
          'delete': this.undoDeleteImage,
          'move': this.undoMoveImageToAcceptedLocation
        };

        const lastAction = await this.getLastUndoAction(category, user);

        if (!lastAction) {
            return null;
        }

        if (!actionFunctionMap[lastAction.action]) {
            throw new Error('Invalid action');
        }

        return await actionFunctionMap[lastAction.action](category, lastAction.image);
    }
    
}
