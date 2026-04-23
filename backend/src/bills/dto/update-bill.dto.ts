import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateBillDto {
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
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsIn(['paid', 'unpaid', 'overdue'])
  status?: 'paid' | 'unpaid' | 'overdue';

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
  category?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsIn(['monthly', 'quarterly'])
  frequency?: 'monthly' | 'quarterly';
}