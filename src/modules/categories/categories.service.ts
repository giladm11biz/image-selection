import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp'; 
import { CropDataDto } from './dtos/CropData.dto';
import _ from 'lodash';

const UNDO_ACTIONS_TIME_TO_SAVE = 8 * 60 * 60;
const UNDO_ACTIONS_TO_SAVE = 20;

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private categoriesRepository: Repository<Category>,
        private redisService: RedisService
    ) {}

    async getCategoriesForUser(userId: number): Promise<any[]> {
        return await this.categoriesRepository.find();
    }

    getFreeImagesListKey(category: Category) {
        return `category_${category.id}_free_images`;
    }

    getUserCurrentImagesKey(category: Category, userId: number | String) {
        return `category_${category.id}_${userId}_images`;
    }

    getActiveUsersWithImagesSetKey(category: Category) {
        return `categoty_${category.id}_users_images_set`;
    }

    getLockKey(key) {
        return key + "_lock";
    }

    getUndoActionListKey(category: Category, userId: number) {
        return `undo_${category.id}_${userId}`;
    }

    async refreshRedisDataAndRemoveUserIfNeeded(category: Category, userIdToRemove: number = null) {
        const lockKey = this.getLockKey(this.getFreeImagesListKey(category));
        let lockObj = await this.redisService.lockKey(lockKey);

        try {
            const activeUsersWithImagesSetKey = this.getActiveUsersWithImagesSetKey(category);
        
            if (userIdToRemove) {
                const userCurrentImagesKey = this.getUserCurrentImagesKey(category, userIdToRemove);
                await this.redisService.del(userCurrentImagesKey);
                await this.redisService.srem(activeUsersWithImagesSetKey, [String(userIdToRemove)]);
            }
            
            const freeImagesListKey = this.getFreeImagesListKey(category);
            const usersWithImagesIds = await this.redisService.smembers(activeUsersWithImagesSetKey);
            const getUsersOccupiedImageNames = usersWithImagesIds.length == 0 ? [] : await this.getUsersOccupiedImageNames(category, usersWithImagesIds)
            const files = fs.readdirSync(category.sourcePath);
    
            const freeFiles = _.difference(files, getUsersOccupiedImageNames);
    
            await this.redisService.del(freeImagesListKey);
    
            if (freeFiles.length > 0) {
                await this.redisService.rpush(freeImagesListKey, freeFiles);        
            }
        } finally {
            await this.redisService.unlockKey(lockObj);
        }
    }

    async getUsersOccupiedImageNames(category: Category, usersIds: String[]) {
        let keys = usersIds.map(userId => this.getUserCurrentImagesKey(category, userId));
        let result = [];

        const resultPromises = keys.map(async key => {
            const value = await this.redisService.lrange(key, 0, -1);
            return value;
        });

        result = _.flatten(await Promise.all(resultPromises));

        return result;
    }

    async getUserNextImageNameAndSaveToRedis(category: Category, userId: number) {
        const freeImagesListKey = this.getFreeImagesListKey(category);

        const freeImagesListLockKey = this.getLockKey(this.getFreeImagesListKey(category));

        console.log('wating for lock...');

        await this.redisService.waitForLock(freeImagesListLockKey);

        console.log('unlocked');

        const imageName = await this.redisService.lpop(freeImagesListKey);
        
        if (imageName) {
            const activeUsersWithImagesSetKey = this.getActiveUsersWithImagesSetKey(category);
            const userCurrentImagesKey = this.getUserCurrentImagesKey(category, userId);

            await this.redisService.sadd(activeUsersWithImagesSetKey, [String(userId)]);
            await this.redisService.rpush(userCurrentImagesKey, imageName);
        }


        return imageName;
    }

    async loadImagesIfNeededAndGetUserNextImage(category: Category, userId: number) {
        let hasLoadedImages = await this.redisService.exists(this.getFreeImagesListKey(category));
        if (!hasLoadedImages) {
            await this.refreshRedisDataAndRemoveUserIfNeeded(category);
        }
        
        return await this.getUserNextImage(category, userId);
    }

    async getUserNextImage(category: Category, userId: number) {
        let userNextImageName = await this.getUserNextImageNameAndSaveToRedis(category, userId);
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
            data: `data:image/png;base64,${await this.getImageBase64(filePath)}`
        };
    }

    async getImageBase64(fileName) {
        let buffer = await sharp(fileName)
                           .webp({ quality: 100 }) // Lossless PNG compression
                           .toBuffer();

        return buffer.toString('base64');
    }

    async getImageByName(category: Category, name: string) {
        const fileName = path.join(category.sourcePath, name);

        return {
            fileName: name,
            data: `data:image/png;base64,${await this.getImageBase64(fileName)}`
        };
    }

    async addUndoAction(category: Category, userId: number, actionData: any) {
        let key = this.getUndoActionListKey(category, userId);
        
        await this.redisService.lpush(key, JSON.stringify(actionData), UNDO_ACTIONS_TIME_TO_SAVE);
        await this.redisService.ltrim(key, 0, UNDO_ACTIONS_TO_SAVE - 1);
    }

    async getLastUndoAction(category: Category, userId: number) {
        let key = this.getUndoActionListKey(category, userId);
        let undoAction = await this.redisService.lindex(key, 0);
        return undoAction ? JSON.parse(undoAction) : null;
    }

    async removeLastUndoAction(category: Category, userId: number) {
        let key = this.getUndoActionListKey(category, userId);
        await this.redisService.lpop(key);
    }

    async cropImage(category: Category, userId: number, imageName: string, cropData: CropDataDto): Promise<any> {
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
            

        await this.addUndoAction(category, userId, { action: 'crop', image });

        return await this.getImageByName(category, imageName);
    }

    async undoCropImage(category: Category, image) {
        const {fileName, data} = image;

        const imagePath = path.join(category.sourcePath, fileName);
        
        fs.writeFileSync(imagePath, Buffer.from(data.split(',')[1], 'base64'));

        return image;
    }

    async deleteImage(category: Category, userId: number, imageName: string): Promise<void> {
        const image = await this.getImageByName(category, imageName);
        const imagePath = path.join(category.sourcePath, imageName);

        if (!image) {
          throw new Error('Image not found in fs');
        }
    
        fs.unlinkSync(imagePath);

        await this.addUndoAction(category, userId, { action: 'delete', image });
    }

    async undoDeleteImage(category: Category, image) {
        const {fileName, data} = image;
        const imagePath = path.join(category.sourcePath, path.basename(fileName));

        fs.writeFileSync(imagePath, Buffer.from(data.split(',')[1], 'base64'));

        return image;
    }

    async moveImageToAcceptedLocation(category: Category, userId: number, imageName: string): Promise<void> {
        let imagePath = path.join(category.sourcePath, imageName);

        const destinationPath = path.join(category.destinationPath, imageName);

        fs.renameSync(imagePath, destinationPath);

        await this.addUndoAction(category, userId, { action: 'move', image: imageName });    
    }

    async undoMoveImageToAcceptedLocation(category: Category, imageName) {
        const imageOriginalPath = path.join(category.sourcePath, imageName);
        const currentPath = path.join(category.destinationPath, imageName);

        fs.renameSync(currentPath, imageOriginalPath);

        return this.getImageByName(category, imageName);
    }

    async undoAction(category: Category, userId: number): Promise<void> {
        const actionFunctionMap = {
          'crop': this.undoCropImage.bind(this),
          'delete': this.undoDeleteImage.bind(this),
          'move': this.undoMoveImageToAcceptedLocation.bind(this)
        };

        const lockKey = this.getLockKey(this.getUndoActionListKey(category, userId));

        let lockObj = await this.redisService.lockKey(lockKey);

        try {
            const lastAction = await this.getLastUndoAction(category, userId);

            if (!lastAction) {
                return null;
            }
    
            if (!actionFunctionMap[lastAction.action]) {
                throw new Error('Invalid action');
            }
    
            let result = await actionFunctionMap[lastAction.action](category, lastAction.image);
    
            await this.removeLastUndoAction(category, userId);
        
            return result;    
        } finally {
            await this.redisService.unlockKey(lockObj);
        }

    }
    
}
