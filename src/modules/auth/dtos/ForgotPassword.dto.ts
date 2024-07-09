import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { isExists } from 'src/validators/IsExistsConstraint.validator';

export class ForgotPasswordDto {
  @IsNotEmpty()	
  @IsEmail()
  @MaxLength(255)
  @isExists({tableName: 'users', column: 'email'})
  email: string;
}