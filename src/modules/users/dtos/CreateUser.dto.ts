import { IsBoolean, IsEmail, IsNotEmpty, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { isUnique } from 'src/validators/IsUniqueConstraint.validator';
import { UpdateUserDto } from './UpdateUser.dto';

export class CreateUserDto extends UpdateUserDto {

  @IsNotEmpty()	
  @IsEmail()
  @MaxLength(255)
  @isUnique({tableName: 'users', column: 'email'})
  email: string;

  @MinLength(8)
  @MaxLength(32)
  password: string;

  @IsNotEmpty()
  @IsBoolean()
  mailUpdates: boolean;
}