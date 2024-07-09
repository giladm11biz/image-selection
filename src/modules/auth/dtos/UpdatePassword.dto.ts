import {  IsNotEmpty, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdatePasswordDto {
  @ValidateIf((o) => o.nickname && o.nickname.trim() !== '')
  @MinLength(8)
  @MaxLength(32)
  oldPassword: string;

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(32)
  newPassword: string;
}