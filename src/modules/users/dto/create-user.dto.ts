import {
  IsEnum,
  IsOptional,
  IsString,
  IsEmail,
  IsArray,
  IsNotEmpty,
} from 'class-validator';
import { Roles } from '../enums/roles.enum';
import { gender } from '../enums/gender.enum';

export class CreateUserDto {
  @IsEnum(Roles)
  @IsOptional()
  role?: Roles;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  approved: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsEnum(gender)
  @IsOptional()
  gender?: gender;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  skypeId?: string;

  @IsString()
  @IsOptional()
  organization?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsArray()
  @IsOptional()
  profilePicture?: string[];
}
