import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateBillDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  provider!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsDateString()
  dueDate!: string;

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

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsIn(['monthly', 'quarterly'])
  frequency?: 'monthly' | 'quarterly';
}