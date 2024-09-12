import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';
import { User } from 'src/modules/users/entities/user.entity';

export class CallHistoryDto {
  @IsOptional()
  client: User;

  @IsOptional()
  interpreter: User;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsNumber()
  @IsNotEmpty()
  bill: number;
}
