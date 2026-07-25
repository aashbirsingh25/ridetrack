import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rider } from './entities/rider.entity';
import { RegisterRiderDto } from './dto/register-rider.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class RidersService {
  constructor(
    @InjectRepository(Rider)
    private readonly riderRepository: Repository<Rider>,
  ) {}

  /**
   * Registers a new rider in PostgreSQL.
   */
  async registerRider(dto: RegisterRiderDto): Promise<Rider> {
    const rider = this.riderRepository.create({
      ...dto,
      isAvailable: true,
    });
    return this.riderRepository.save(rider);
  }

  /**
   * Updates an existing rider's current latitude and longitude.
   */
  async updateLocation(id: string, dto: UpdateLocationDto): Promise<Rider> {
    const rider = await this.findRiderById(id);
    rider.currentLat = dto.currentLat;
    rider.currentLng = dto.currentLng;
    return this.riderRepository.save(rider);
  }

  /**
   * Toggles a rider's availability status (true/false).
   */
  async updateAvailability(
    id: string,
    dto: UpdateAvailabilityDto,
  ): Promise<Rider> {
    const rider = await this.findRiderById(id);
    rider.isAvailable = dto.isAvailable;
    return this.riderRepository.save(rider);
  }

  /**
   * Lists all riders in the database.
   * Supports optional filtering by availability (?available=true / ?available=false).
   */
  async findAll(available?: boolean): Promise<Rider[]> {
    const whereClause: any = {};
    if (available !== undefined) {
      whereClause.isAvailable = available;
    }
    return this.riderRepository.find({
      where: whereClause,
      order: { lastUpdatedAt: 'DESC' },
    });
  }

  /**
   * Finds a single rider by UUID primary key.
   */
  async findRiderById(id: string): Promise<Rider> {
    const rider = await this.riderRepository.findOne({ where: { id } });
    if (!rider) {
      throw new NotFoundException(`Rider with ID '${id}' not found`);
    }
    return rider;
  }

  /**
   * Finds the single nearest AVAILABLE rider to target coordinates using the Haversine distance formula.
   *
   * @param targetLat Target Latitude (e.g., order pickup location)
   * @param targetLng Target Longitude (e.g., order pickup location)
   * @returns Object containing nearest rider entity and calculated distance in kilometers.
   */
  async findNearestAvailableRider(
    targetLat: number,
    targetLng: number,
  ): Promise<{ rider: Rider; distanceKm: number }> {
    // Fetch all currently available riders
    const availableRiders = await this.riderRepository.find({
      where: { isAvailable: true },
    });

    if (!availableRiders || availableRiders.length === 0) {
      throw new NotFoundException('No available riders found near the requested location');
    }

    let nearestRider: Rider | null = null;
    let minDistanceKm = Infinity;

    for (const rider of availableRiders) {
      const distance = this.calculateHaversineDistance(
        targetLat,
        targetLng,
        rider.currentLat,
        rider.currentLng,
      );

      if (distance < minDistanceKm) {
        minDistanceKm = distance;
        nearestRider = rider;
      }
    }

    return {
      rider: nearestRider,
      distanceKm: parseFloat(minDistanceKm.toFixed(2)),
    };
  }

  /**
   * Haversine formula calculation to find distance in kilometers between two coordinates.
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const EARTH_RADIUS_KM = 6371; // Earth radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
