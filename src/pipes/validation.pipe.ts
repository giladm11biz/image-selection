// validation.pipe.ts

import { ArgumentMetadata, Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      throw new BadRequestException({ errors: formattedErrors });
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype as any);
  }

  private formatErrors(errors: any[]): any {
    const formattedErrors = {};
    errors.forEach(error => {
      const propertyName = error.property;
      Object.entries(error.constraints).forEach(([constraintName, errorMessage]) => {
        if (!formattedErrors[propertyName]) {
          formattedErrors[propertyName] = [];
        }
        formattedErrors[propertyName].push(errorMessage);
      });
    });
    return formattedErrors;
  }
}
