import { IsNotEmpty, IsNumber, IsString, IsLatitude, IsLongitude } from 'class-validator';

/**
 * Data Transfer Object (DTO) for registering a new rider.
 * Validates request payload received at POST /riders.
 */
export class RegisterRiderDto {
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'phone is required' })
  phone: string;

  @IsNumber({}, { message: 'currentLat must be a valid number' })
  @IsLatitude({ message: 'currentLat must be a valid latitude (-90 to 90)' })
  currentLat: number;

  @IsNumber({}, { message: 'currentLng must be a valid number' })
  @IsLongitude({ message: 'currentLng must be a valid longitude (-180 to 180)' })
  currentLng: number;
}
