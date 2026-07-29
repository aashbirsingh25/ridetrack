import { IsNotEmpty, IsString } from 'class-validator';

export class StatusUpdateDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsString()
  status: string;
}
