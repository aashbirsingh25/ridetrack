import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for customer joining an order tracking room.
 */
export class TrackJoinDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}
