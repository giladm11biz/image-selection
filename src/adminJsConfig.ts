import { ConfigModule } from '@nestjs/config';
import { TelegramModule } from './modules/telegram/telegram.module';
import { TelegramService } from './modules/telegram/telegram.service';
import { User } from './modules/users/user.entity';
import { Category } from './modules/categories/category.entity';
import bcrypt from 'bcrypt';

export default async () =>  {
const { AdminModule } = await import('@adminjs/nestjs');
const { Database, Resource } = await import('@adminjs/typeorm');
const AdminJS = await import('adminjs');

  AdminJS.default.registerAdapter({ Database, Resource });
  
  
  return AdminModule.createAdminAsync({
    imports: [TelegramModule, ConfigModule.forRoot()],
    inject: [TelegramService],
    useFactory: (telegramService: TelegramService) => ({
      adminJsOptions: {
        rootPath: '/admin',
        resources: [User, Category],        
      },
      auth: {
        authenticate: async (email, password) => {
          if (process.env.NODE_ENV !='development') {
            try {
              telegramService.sendMessageToAdminGroup(`Admin login attempt from ${email}`);
            } catch (error) {
              console.error(error);
            }
          }

          const user = await User.findOne({ where: { email, isAdmin: true, isBlocked: false} });
          if (user) {
            if (user.isLoginBlocked()) {
              return null;
            }

            const matched = await bcrypt.compare(password, user.password);
            if (matched) {
              return Promise.resolve({ email: email });
            } else {
              user.updateUserFailedLoginAttempts();
            }
          }
          return null;
        },
        cookieName: 'admin',
        cookiePassword:
          process.env.ADMIN_SECRET,
      },
      sessionOptions: {
        resave: true,
        saveUninitialized: true,
        secret: process.env.ADMIN_SECRET,
        cookie: {
          httpOnly: process.env.NODE_ENV != 'production',
          secure: process.env.NODE_ENV != 'production',
        },    
      },
    }),
})};