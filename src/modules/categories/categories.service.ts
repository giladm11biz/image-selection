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
import _ from 'lodash';

const IMAGES_LIST_TIMEOUT = 24 * 60 * 60;
const UNDO_ACTIONS_TIMEOUT = 8 * 60 * 60;
const UNDO_ACTIONS_TO_SAVE = 10;

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

    getImagesListKey(category: Category) {
        return `category_${category.id}_images_by_user`;
    }

    getLockKey(key) {
        return key + "_lock";
    }

    getUndoActionListKey(category: Category, user: User) {
        return `undo_${category.id}_${user.id}`;
    }

    async refreshRedisData(category: Category, userToRemove: User = null) {
        const imagesKey = this.getImagesListKey(category);
        const lockKey = this.getLockKey(imagesKey);

        const files = fs.readdirSync(category.sourcePath);

        let lock = await this.redisService.lockKey(lockKey);
        
        try {

            let redisData = await this.redisService.get(imagesKey);

            let imagesData = redisData && redisData != '' ? JSON.parse(redisData) : {};

            if (userToRemove) {
                delete imagesData[userToRemove.id];
            }

            let usedImages = {...imagesData};
            delete usedImages[-1];

            usedImages = _.flatten(Object.values(usedImages));

            imagesData[-1] = _.difference(files, usedImages);


            this.redisService.set(imagesKey, JSON.stringify(imagesData), IMAGES_LIST_TIMEOUT);
            
        } finally {
            this.redisService.unlockKey(lock);
        }

    }

    async getUserNextImageNameAndSaveToRedis(category: Category, user: User) {

        const imagesKey = this.getImagesListKey(category);
        const lockKey = this.getLockKey(imagesKey);

        let time = new Date().valueOf();
        console.log('before lock', time);


        let lock = await this.redisService.lockKey(lockKey);

        let imageName = null;

        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            let redisData = await this.redisService.get(imagesKey);

            let imagesData = redisData ? JSON.parse(redisData) : {};
    
            if (!imagesData[user.id]) {
                imagesData[user.id] = [];
            }
    
    
            if (imagesData[-1] && imagesData[-1].length > 0) {
                imageName = imagesData[-1].shift();
                imagesData[user.id].push(imageName);
            }
    
            this.redisService.set(imagesKey, JSON.stringify(imagesData), IMAGES_LIST_TIMEOUT);
    
        } finally {
            await this.redisService.unlockKey(lock);
            console.log('after lock', time);
        }


        return imageName;
    }

    async getUserNextImage(category: Category, user: User, resetUserImages: boolean = false) {
        if (resetUserImages) {
            this.refreshRedisData(category, resetUserImages ? user : null);
        }

        let userNextImageName = await this.getUserNextImageNameAndSaveToRedis(category, user);
        //     .filter(file => /\.(jpg|jpeg|png|gif)$/.test(file))

        if (!userNextImageName) {
            return null;
        }

        const filePath = path.join(category.sourcePath, userNextImageName);

        if (!fs.existsSync(filePath)) {
            return null;
        }

        return {
            fileName: userNextImageName,
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
        let key = this.getUndoActionListKey(category, user);
        
        await this.redisService.lpush(key, JSON.stringify(actionData), UNDO_ACTIONS_TIMEOUT);
        await this.redisService.ltrim(key, 0, UNDO_ACTIONS_TO_SAVE - 1);
    }

    async getLastUndoAction(category: Category, user: User) {
        let key = this.getUndoActionListKey(category, user);
        let undoAction = await this.redisService.lindex(key, 0);
        return undoAction ? JSON.parse(undoAction) : null;
    }

    async removeLastUndoAction(category: Category, user: User) {
        let key = this.getUndoActionListKey(category, user);
        await this.redisService.lpop(key);
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

        const lockKey = this.getLockKey(this.getUndoActionListKey(category, user));

        let lockObj = await this.redisService.lockKey(lockKey);

        try {
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
        } finally {
            await this.redisService.unlockKey(lockObj);
        }

    }
    
}
