import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class EmailContentDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsEmail()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;
}
