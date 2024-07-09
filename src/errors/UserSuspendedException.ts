import { BadRequestException } from "@nestjs/common";

const MESSAGE = "Your account has been suspended. Please contact support if you think it's a mistake.";

export default class UserSuspendedException extends BadRequestException {

    constructor() {
        super({ errors: {
            email: [MESSAGE],
        }});
    }
}