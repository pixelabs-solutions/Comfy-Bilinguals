import { IsOptional, IsString, IsIn } from 'class-validator';

export class GetBillingHistoryFilterDto {
  @IsOptional()
  @IsString()
  interpreter?: string;

  @IsOptional()
  @IsIn(['weekly', 'monthly', 'yearly'])
  filter?: 'weekly' | 'monthly' | 'yearly';
}
