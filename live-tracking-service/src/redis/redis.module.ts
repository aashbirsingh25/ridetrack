import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Injection token for the Redis client instance.
 */
export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService): Redis => {
        const redisUrl = configService.get<string>(
          'REDIS_URL',
          'redis://localhost:6379',
        );

        const client = new Redis(redisUrl, {
          // Keep connection alive & handle reconnection gracefully
          lazyConnect: false,
          maxRetriesPerRequest: 3,
        });

        client.on('connect', () => {
          console.log(`[RedisModule] Successfully connected to Redis at ${redisUrl}`);
        });

        client.on('error', (err) => {
          console.error('[RedisModule] Redis connection error:', err.message);
        });

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
