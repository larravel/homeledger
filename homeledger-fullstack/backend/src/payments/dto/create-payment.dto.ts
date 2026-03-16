import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsDateString()
  paymentDate: string;
}