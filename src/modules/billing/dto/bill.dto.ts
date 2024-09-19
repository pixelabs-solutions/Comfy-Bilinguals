import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Billing_Status } from '../enum/billingStatus.enum';
import { Roles } from 'src/modules/users/enums/roles.enum';
import { User } from 'src/modules/users/entities/user.entity';

export class BillDto {
  @ApiProperty({
    description: 'ID of the interpreter related to this bill',
    example: 1,
  })
  @IsNotEmpty()
  user: User;

  @ApiProperty({
    description: 'Status of the bill, pending or cleared',
    enum: Billing_Status,
    default: Billing_Status.PENDING,
  })
  @IsEnum(Billing_Status)
  @IsOptional()
  status?: Billing_Status;

  @ApiProperty({
    description: 'The total amount for the bill',
    example: 1200.5,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  amount?: number;

  @ApiProperty({
    description: 'The role associated with the bill (client or interpreter)',
    enum: Roles,
    default: Roles.CLIENT,
  })
  @IsEnum(Roles)
  @IsOptional()
  role?: Roles;

  @IsDate()
  @IsOptional()
  from: Date;
}
