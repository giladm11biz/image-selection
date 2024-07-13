import { IsNotEmpty, IsInt } from 'class-validator';

export class CropDataDto {
  @IsNotEmpty()
  @IsInt()
  width: number;

  @IsNotEmpty()
  @IsInt()
  height: number;

  @IsNotEmpty()
  @IsInt()
  left: number;

  @IsNotEmpty()
  @IsInt()
  top: number;
}