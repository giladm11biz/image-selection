
import { Injectable } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService {
  private telegram;

  constructor() {
    this.telegram = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  }

  async sendMessage(chatId: string, message: string, options: any = { parse_mode: 'html' }) {
    await this.telegram.sendMessage(chatId, message, options);
  }

  async sendMessageToAdminGroup(message: string) {
    await this.sendMessage(process.env.TELEGRAM_ADMIN_GROUP_ID, message);
  }

  async sendErrorToAdminGroupWithoutExceptionOnFail(error: any) {

    let message = 'Error occured: ';
    try {
      if (error.message || error.name || error.stack) {
        message = message + '\n<ins><b>Error message:</b></ins> ' + error.message + '\n';
        message = message + '<ins><b>Error name:</b></ins> ' + error.name + '\n';
        message = message + '<ins><b>Error stack:</b></ins> ' + error.stack;  
      } else {
        message = message + error;
      }

      await this.sendMessageToAdminGroup(message);
  
    } catch (error) {
      console.error("Error sending telegram error");
      console.error(error);
    }
  }
}

