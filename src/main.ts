import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from './pipes/validation.pipe';
import { useContainer } from 'class-validator';
import { SendErrorsToTelegramFilter } from './filters/sendErrorsToTelegram.filter';
import { TelegramService } from './modules/telegram/telegram.service';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new SendErrorsToTelegramFilter(app.get(HttpAdapterHost), app.get(TelegramService)));
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


