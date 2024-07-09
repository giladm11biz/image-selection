import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpException, HttpStatus, UnauthorizedException } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { TelegramService } from "src/modules/telegram/telegram.service";

@Catch()
export class SendErrorsToTelegramFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost, private telegramService: TelegramService) {}
  catch(exception: Error, host: ArgumentsHost) {

    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
  
    let shouldSendExeption = process.env.NODE_ENV != 'development';
    shouldSendExeption = shouldSendExeption && !(exception instanceof BadRequestException || exception instanceof UnauthorizedException);

    if (shouldSendExeption) {
      console.error(exception);
      this.telegramService.sendErrorToAdminGroupWithoutExceptionOnFail(exception);
    }

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    httpAdapter.reply(ctx.getResponse(), exception['response'], httpStatus);

  }
}