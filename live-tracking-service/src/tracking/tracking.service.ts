import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { LocationUpdateDto, LocationDataPayload } from './dto/location-update.dto';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Save the latest location update for a specific order into Redis.
   * Redis Key pattern: location:{orderId}
   * Value: JSON string containing riderId, orderId, lat, lng, timestamp
   */
  async saveLocation(updateDto: LocationUpdateDto): Promise<LocationDataPayload> {
    const { orderId, riderId, lat, lng } = updateDto;
    const redisKey = `location:${orderId}`;

    const payload: LocationDataPayload = {
      riderId,
      orderId,
      lat,
      lng,
      timestamp: new Date().toISOString(),
    };

    // Store in Redis as a JSON string
    await this.redis.set(redisKey, JSON.stringify(payload));
    this.logger.log(`Location stored in Redis for order [${orderId}] -> lat: ${lat}, lng: ${lng}`);

    return payload;
  }

  /**
   * Retrieve the last known location for an order from Redis.
   */
  async getLocation(orderId: string): Promise<LocationDataPayload | null> {
    const redisKey = `location:${orderId}`;
    const rawData = await this.redis.get(redisKey);

    if (!rawData) {
      this.logger.debug(`No location found in Redis for order [${orderId}]`);
      return null;
    }

    try {
      return JSON.parse(rawData) as LocationDataPayload;
    } catch (error) {
      this.logger.error(`Failed to parse location JSON from Redis for order [${orderId}]`, error);
      return null;
    }
  }
}
