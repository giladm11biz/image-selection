
import { Profanity, ProfanityOptions } from '@2toad/profanity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProfanityService {
  public profanity;

  constructor() {
    const options = new ProfanityOptions();
    options.wholeWord = false;
    options.grawlix = '*****';
    

    this.profanity = new Profanity(options);
  }

  exists(value: string): boolean {
    return this.profanity.exists(value);
  }
}

