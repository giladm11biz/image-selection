import { BadRequestException } from "@nestjs/common";

const MESSAGE = "Incorrect email or password";

export default class InvalidLoginException extends BadRequestException {

    constructor() {
        super({ errors: {
            email: [MESSAGE],
            password: [MESSAGE]
        }});
    }
}