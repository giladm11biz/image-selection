import { Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsNotEmpty, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { isNotProfanity } from 'src/validators/IsNotProfanity.validator';

export class UpdateUserDto {
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty()
    @MaxLength(255)
    @MinLength(2)
    @isNotProfanity()
    @Matches(/^[a-zA-Z0-9 ]*$/, {
      message: 'Name can only consist of English letters and numbers',
    })
    name: string;

    @Transform(({ value }: TransformFnParams) => value?.trim())
    @ValidateIf((o) => o.nickname && o.nickname.trim() !== '')
    @MinLength(2)
    @MaxLength(30)
    @isNotProfanity()
    @Matches(/^[a-zA-Z0-9 ]*$/, {
      message: 'Nickname can only consist of English letters and numbers',
    })
    nickname: string;
  

    @IsNotEmpty()
    @IsBoolean()
    mailUpdates: boolean;
}