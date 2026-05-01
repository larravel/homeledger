import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateExpenseDto {
  @IsOptional()
  @IsIn([
    'groceries',
    'rent',
    'utilities',
    'transportation',
    'entertainment',
    'healthcare',
    'dining',
    'shopping',
    'insurance',
    'education',
    'other',
  ])
  category?:
    | 'groceries'
    | 'rent'
    | 'utilities'
    | 'transportation'
    | 'entertainment'
    | 'healthcare'
    | 'dining'
    | 'shopping'
    | 'insurance'
    | 'education'
    | 'other';

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
