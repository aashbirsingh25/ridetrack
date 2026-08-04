import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /**
   * GET /tracking
   * Health check endpoint for Kubernetes liveness & readiness probes.
   */
  @Get()
  healthCheck() {
    return { status: 'ok', service: 'live-tracking-service' };
  }

  /**
   * GET /tracking/:orderId/location
   * Returns the last known location for an order directly from Redis.
   * Useful for testing & REST consumers without requiring a WebSocket client connection.
   */
  @Get(':orderId/location')
  async getOrderLocation(@Param('orderId') orderId: string) {
    const location = await this.trackingService.getLocation(orderId);

    if (!location) {
      throw new NotFoundException(
        `No last known location found for orderId: ${orderId}`,
      );
    }

    return {
      statusCode: 200,
      message: 'Last known location retrieved successfully',
      data: location,
    };
  }
}
