import { BadRequestException } from "@nestjs/common";

const MESSAGE = "You tried to log in too many times, your account has been locked. Please try again in an hour, or reset your password in the forgot password below.";

export default class UserLoginBlockedException extends BadRequestException {

    constructor() {
        super({ errors: {
            email: [MESSAGE],
        }});
    }
}