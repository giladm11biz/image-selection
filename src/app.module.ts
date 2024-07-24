import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule} from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { IsUniqueConstraint } from './validators/IsUniqueConstraint.validator';
import { IsExistsConstraint } from './validators/IsExistsConstraint.validator';
import { MailModule } from './modules/mail/mail.module';
import { ProfanityModule } from './modules/profanity/profanity.module';
import { IsNotProfanityConstraint } from './validators/IsNotProfanity.validator';
import adminJsConfig from './adminJsConfig';
import { CategoriesModule } from './modules/categories/categories.module';
import { WebsocketGateway } from './modules/websocket/websocket.gateway';
import { EventEmitterModule } from '@nestjs/event-emitter';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client/dist'),
    }),
    // AdminJS version 7 is ESM-only. In order to import it, you have to use dynamic imports.
    adminJsConfig(), 
    EventEmitterModule.forRoot(),
    UsersModule,
    AuthModule,
    MailModule,
    ProfanityModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService, IsUniqueConstraint, IsExistsConstraint, IsNotProfanityConstraint],
})



export class AppModule {}
