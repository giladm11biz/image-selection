import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from './pipes/validation.pipe';
import { useContainer } from 'class-validator';
import { SendErrorsToTelegramFilter } from './filters/sendErrorsToTelegram.filter';
import { TelegramService } from './modules/telegram/telegram.service';
import * as compression from 'compression';
import * as iltorb from 'iltorb';
import { RedisClient } from './modules/redis/redis.provider';
import { RedisAdapter } from './modules/redis/redis.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const redisIoAdapter = new RedisAdapter(app);
  await redisIoAdapter.connectToRedis(app.get<RedisClient>('REDIS_CLIENT'));
  app.useWebSocketAdapter(redisIoAdapter);


  
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new SendErrorsToTelegramFilter(app.get(HttpAdapterHost), app.get(TelegramService)));
  app.use(compression.default({
    level: 9, // Set the compression level (0-9)
    threshold: 1024 * 1000, // Compress responses only if they are larger than 1 MB
    brotli: iltorb,
  }));
  useContainer(app.select(AppModule), {fallbackOnErrors: true});


  app.setGlobalPrefix('api', { exclude: ['auth/confirm_user_email'] }); // New

  if (process.env.NODE_ENV == 'development') {
    app.enableCors();
  }

  await app.listen(3000);

  // const server = app.getHttpServer();
  // const router = server._events.request._router;

  // const availableRoutes: [] = router.stack
  //   .map(layer => {
  //     if (layer.route) {
  //       return {
  //         route: {
  //           path: layer.route?.path,
  //           method: layer.route?.stack[0].method,
  //         },
  //       };
  //     }
  //   })
  //   .filter(item => item !== undefined);
  // console.log(availableRoutes);

}
bootstrap();


