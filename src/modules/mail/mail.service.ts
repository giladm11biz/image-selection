import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService, private readonly telegramService: TelegramService) {}

  async sendMail(mailOptions: any) {
    await this.mailerService.sendMail(mailOptions);
  }
}

