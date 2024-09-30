import {
  IsNotEmpty,
  IsInt,
  IsString,
  Max,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  stars: number;

  @IsString()
  content: string;

  @IsInt()
  @IsOptional()
  clientId: number; // The client who gives the rating

  @IsInt()
  @IsOptional()
  interpreterId: number; // The interpreter who receives the rating
}
