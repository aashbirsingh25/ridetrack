import { IsNumber, IsLatitude, IsLongitude } from 'class-validator';

/**
 * Data Transfer Object (DTO) for updating rider location.
 * Validates request payload received at PATCH /riders/:id/location.
 */
export class UpdateLocationDto {
  @IsNumber({}, { message: 'currentLat must be a valid number' })
  @IsLatitude({ message: 'currentLat must be a valid latitude (-90 to 90)' })
  currentLat: number;

  @IsNumber({}, { message: 'currentLng must be a valid number' })
  @IsLongitude({ message: 'currentLng must be a valid longitude (-180 to 180)' })
  currentLng: number;
}
