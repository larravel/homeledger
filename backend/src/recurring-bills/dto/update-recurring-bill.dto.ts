import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateRecurringBillDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsIn([
    'utility',
    'rent',
    'subscription',
    'loan',
    'insurance',
    'transportation',
    'healthcare',
    'education',
  ])
  category?:
    | 'utility'
    | 'rent'
    | 'subscription'
    | 'loan'
    | 'insurance'
    | 'transportation'
    | 'healthcare'
    | 'education';

  @IsOptional()
  @IsIn(['monthly', 'quarterly'])
  frequency?: 'monthly' | 'quarterly';

  @IsOptional()
  @IsDateString()
  startDate?: string;
}
