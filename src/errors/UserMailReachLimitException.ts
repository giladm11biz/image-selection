import { BadRequestException } from "@nestjs/common";

const MESSAGE = "You need to wait 15 minutes before you can send another email.";

export default class UserMailReachLimitException extends BadRequestException {

    constructor(User) {
        super({ errors: {
            email: [MESSAGE] 
        }, timeLeft: User.timeLeftToSendMail()});
    }
}