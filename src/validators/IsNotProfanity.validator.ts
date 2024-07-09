import { Injectable } from "@nestjs/common"
import { ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from "class-validator"
import { ProfanityService } from "src/modules/profanity/profanity.service"

@ValidatorConstraint({name: 'IsNotProfanityConstraint', async: true})
@Injectable()
export class IsNotProfanityConstraint implements ValidatorConstraintInterface {
    constructor(private readonly profanityService: ProfanityService) {}
    validate(text: string, args: ValidationArguments) {
        return !this.profanityService.exists(text); // for async validations you must return a Promise<boolean> here
    }

    defaultMessage(validationArguments?: ValidationArguments) {
        const field: string = validationArguments.property
        return `${field} can't contain profanity`
    }
}

// decorator function
export function isNotProfanity(options?: any, validationOptions?: ValidationOptions) {
    return function (object: any, propertyName: string) {
        registerDecorator({
            name: 'isNotProfanity',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [options],
            validator: IsNotProfanityConstraint,
        })
    }
}