import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateExpenseDto {
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
  category!:
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

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
