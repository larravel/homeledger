import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateRecurringBillDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  provider!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

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
  category!:
    | 'utility'
    | 'rent'
    | 'subscription'
    | 'loan'
    | 'insurance'
    | 'transportation'
    | 'healthcare'
    | 'education';

  @IsIn(['monthly', 'quarterly'])
  frequency!: 'monthly' | 'quarterly';

  @IsDateString()
  startDate!: string;
}
