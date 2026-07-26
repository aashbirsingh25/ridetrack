import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';

/**
 * Data Transfer Object (DTO) for updating an existing order's status.
 * Validates request payload received at PATCH /orders/:id/status.
 */
export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message: `status must be one of the following values: ${Object.values(OrderStatus).join(', ')}`,
  })
  @IsNotEmpty({ message: 'status is required' })
  status: OrderStatus;

  @IsOptional()
  @IsString()
  riderId?: string;
}
