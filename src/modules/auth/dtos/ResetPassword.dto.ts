import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { isExists } from 'src/validators/IsExistsConstraint.validator';

export class ResetPasswordDto {
  @IsNotEmpty()	
  @IsEmail()
  @MaxLength(255)
  @isExists({tableName: 'users', column: 'email'})
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(32)
  password: string;


  @IsNotEmpty()
  passwordResetCode: string
}