import { IsNotEmpty, IsNumber, IsString, IsLatitude, IsLongitude } from 'class-validator';

/**
 * Data Transfer Object for rider location updates via WebSocket.
 */
export class LocationUpdateDto {
  @IsString()
  @IsNotEmpty()
  riderId: string;

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @IsLatitude()
  lat: number;

  @IsNumber()
  @IsLongitude()
  lng: number;
}

/**
 * Structure of stored location entity in Redis.
 */
export interface LocationDataPayload {
  riderId: string;
  orderId: string;
  lat: number;
  lng: number;
  timestamp: string;
}
