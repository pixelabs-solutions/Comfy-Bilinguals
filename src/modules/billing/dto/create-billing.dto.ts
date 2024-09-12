import { IsNotEmpty, IsEnum, IsNumber } from 'class-validator';
import { Billing_Status } from '../enum/billingStatus.enum';
import { User } from 'src/modules/users/entities/user.entity';

export class CreateBillingDto {
  @IsNotEmpty()
  interpreter: User; // Assuming you pass the interpreter's ID

  @IsEnum(Billing_Status)
  @IsNotEmpty()
  status: Billing_Status;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  amount: number;
}
