import { IsBoolean, IsNotEmpty } from 'class-validator';

/**
 * Data Transfer Object (DTO) for toggling rider availability.
 * Validates request payload received at PATCH /riders/:id/availability.
 */
export class UpdateAvailabilityDto {
  @IsBoolean({ message: 'isAvailable must be a boolean value' })
  @IsNotEmpty({ message: 'isAvailable is required' })
  isAvailable: boolean;
}
