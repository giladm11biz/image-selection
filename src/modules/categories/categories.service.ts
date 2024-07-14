import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../users/user.entity';
import sharp from 'sharp'; 
import { CropDataDto } from './dtos/CropData.dto';

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


        return result;
    }

    async removeLastUndoAction(category: Category, user: User) {
        let key = 'undo_' + category.id + '_' + user.id;
        let undoActions = await this.redisService.get(key);
        let undoActionsArray = JSON.parse(undoActions);

        undoActionsArray.shift()
        await this.redisService.set(key, JSON.stringify(undoActionsArray), 60 * 60 * 1000);
    }

    async cropImage(category: Category, user: User, imageName: string, cropData: CropDataDto): Promise<any> {
        const imagePath = path.join(category.sourcePath, imageName);
        const image = await this.getImageByName(category, imageName);
        if (!image) {
          throw new Error('Image not found in cache');
        }
    
        const outputPath = imagePath;



        sharp.cache(false);
        let file = sharp(imagePath);


        let fileData = await file.metadata();

        let top = Math.max(0, cropData.top);
        let left = Math.max(0, cropData.left);
        let width = Math.min(fileData.width - left, cropData.width);
        let height = Math.min(fileData.height- top, cropData.height);

        await file.extract({ width, height, left, top })
                  .toFile(outputPath + '_temp');

        await fs.unlinkSync(imagePath);
        await fs.renameSync(outputPath + '_temp', imagePath);
            

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

        await this.addUndoAction(category, user, { action: 'delete', image });
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
          'crop': this.undoCropImage.bind(this),
          'delete': this.undoDeleteImage.bind(this),
          'move': this.undoMoveImageToAcceptedLocation.bind(this)
        };

        const lastAction = await this.getLastUndoAction(category, user);

        if (!lastAction) {
            return null;
        }

        if (!actionFunctionMap[lastAction.action]) {
            throw new Error('Invalid action');
        }

        let result = await actionFunctionMap[lastAction.action](category, lastAction.image);

        await this.removeLastUndoAction(category, user);

        return result;
    }
    
}
