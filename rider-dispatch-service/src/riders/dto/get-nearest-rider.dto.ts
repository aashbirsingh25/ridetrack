import { IsNumber, IsLatitude, IsLongitude } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object (DTO) for nearest rider query.
 * Validates query parameters received at GET /riders/nearest?lat=X&lng=Y.
 */
export class GetNearestRiderDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'lat must be a valid number' })
  @IsLatitude({ message: 'lat must be a valid latitude (-90 to 90)' })
  lat: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'lng must be a valid number' })
  @IsLongitude({ message: 'lng must be a valid longitude (-180 to 180)' })
  lng: number;
}
