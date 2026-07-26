import { IsNotEmpty, IsNumber, IsString, IsLatitude, IsLongitude } from 'class-validator';

/**
 * Data Transfer Object (DTO) for creating a new delivery order.
 * Validates request payload received at POST /orders.
 */
export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'customerId is required' })
  customerId: string;

  @IsString()
  @IsNotEmpty({ message: 'pickupAddress is required' })
  pickupAddress: string;

  @IsNumber({}, { message: 'pickupLat must be a valid number' })
  @IsLatitude({ message: 'pickupLat must be a valid latitude (-90 to 90)' })
  pickupLat: number;

  @IsNumber({}, { message: 'pickupLng must be a valid number' })
  @IsLongitude({ message: 'pickupLng must be a valid longitude (-180 to 180)' })
  pickupLng: number;

  @IsString()
  @IsNotEmpty({ message: 'dropAddress is required' })
  dropAddress: string;

  @IsNumber({}, { message: 'dropLat must be a valid number' })
  @IsLatitude({ message: 'dropLat must be a valid latitude (-90 to 90)' })
  dropLat: number;

  @IsNumber({}, { message: 'dropLng must be a valid number' })
  @IsLongitude({ message: 'dropLng must be a valid longitude (-180 to 180)' })
  dropLng: number;
}
