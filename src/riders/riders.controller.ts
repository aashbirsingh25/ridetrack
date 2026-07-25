import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
} from '@nestjs/common';
import { RidersService } from './riders.service';
import { RegisterRiderDto } from './dto/register-rider.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { GetNearestRiderDto } from './dto/get-nearest-rider.dto';

/**
 * Controller exposing RESTful HTTP API endpoints for Rider Management & Dispatch.
 * Keeps controllers thin and delegates business logic to RidersService.
 */
@Controller('riders')
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

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
}
