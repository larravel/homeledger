import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  current: string;

  @IsString()
  @MinLength(6)
  new: string;
}
