import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { EventPattern, Payload, ClientProxy } from '@nestjs/microservices';
import { RidersService } from './riders.service';
import { RegisterRiderDto } from './dto/register-rider.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { GetNearestRiderDto } from './dto/get-nearest-rider.dto';
import { DISPATCH_SERVICE_RMQ } from './riders.constants';

export interface OrderPlacedPayload {
  orderId: string;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
}

/**
 * Controller exposing RESTful HTTP API endpoints for Rider Management & Dispatch,
 * plus RabbitMQ Microservice event handlers for automatic rider matching.
 */
@Controller('riders')
export class RidersController {
  private readonly logger = new Logger(RidersController.name);

  constructor(
    private readonly ridersService: RidersService,
    @Inject(DISPATCH_SERVICE_RMQ) private readonly client: ClientProxy,
  ) {}

  /**
   * POST /riders
   * Register a new rider.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerRiderDto: RegisterRiderDto) {
    return this.ridersService.registerRider(registerRiderDto);
  }

  /**
   * GET /riders/nearest?lat=X&lng=Y
   * Find single nearest AVAILABLE rider to given coordinates using Haversine formula.
   * NOTE: Defined before GET /riders/:id to prevent route shadowing.
   */
  @Get('nearest')
  async findNearest(@Query() query: GetNearestRiderDto) {
    return this.ridersService.findNearestAvailableRider(query.lat, query.lng);
  }

  /**
   * GET /riders
   * List all riders, optionally filtered by availability (?available=true / ?available=false).
   */
  @Get()
  async findAll(@Query('available') available?: string) {
    let filterAvailable: boolean | undefined = undefined;
    if (available !== undefined) {
      filterAvailable = available.toLowerCase() === 'true';
    }
    return this.ridersService.findAll(filterAvailable);
  }

  /**
   * GET /riders/:id
   * Fetch single rider by UUID.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ridersService.findRiderById(id);
  }

  /**
   * PATCH /riders/:id/location
   * Update current latitude and longitude for a rider.
   */
  @Patch(':id/location')
  async updateLocation(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.ridersService.updateLocation(id, updateLocationDto);
  }

  /**
   * PATCH /riders/:id/availability
   * Toggle a rider's availability status (true/false).
   */
  @Patch(':id/availability')
  async updateAvailability(
    @Param('id') id: string,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    return this.ridersService.updateAvailability(id, updateAvailabilityDto);
  }

  /**
   * Event Pattern Listener: "order_placed"
   * Triggered when a new order is placed in Order Service via RabbitMQ.
   * Finds nearest available rider, marks rider as unavailable, and publishes "order_assigned".
   */
  @EventPattern('order_placed')
  async handleOrderPlaced(@Payload() data: OrderPlacedPayload) {
    this.logger.log(
      `[RabbitMQ Event Received: order_placed] Matching order [${data?.orderId}] at pickup: (${data?.pickupLat}, ${data?.pickupLng})`,
    );

    if (!data?.orderId || data?.pickupLat === undefined || data?.pickupLng === undefined) {
      this.logger.error('Invalid order_placed event payload received', data);
      return;
    }

    try {
      // 1. Find nearest available rider
      const match = await this.ridersService.findNearestAvailableRider(
        data.pickupLat,
        data.pickupLng,
      );

      if (match && match.rider) {
        const assignedRider = match.rider;
        this.logger.log(
          `Found nearest rider [${assignedRider.name}] (${assignedRider.id}) at distance ${match.distanceKm} km for order [${data.orderId}]`,
        );

        // 2. Mark matched rider as unavailable in database
        await this.ridersService.updateAvailability(assignedRider.id, {
          isAvailable: false,
        });

        // 3. Publish "order_assigned" event to RabbitMQ
        const eventPayload = {
          orderId: data.orderId,
          riderId: assignedRider.id,
        };

        this.client.emit('order_assigned', eventPayload);
        this.logger.log(
          `[RabbitMQ Event Emitted: order_assigned] Assigned rider [${assignedRider.id}] to order [${data.orderId}]`,
        );
      }
    } catch (error: any) {
      // Handles case where no available riders exist in database
      this.logger.warn(
        `[RabbitMQ: order_placed] Could not automatically match rider for order [${data.orderId}]: ${error.message}`,
      );
    }
  }
}
