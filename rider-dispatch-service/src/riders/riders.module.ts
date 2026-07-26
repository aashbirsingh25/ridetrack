import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RidersController } from './riders.controller';
import { RidersService } from './riders.service';
import { Rider } from './entities/rider.entity';

import { DISPATCH_SERVICE_RMQ } from './riders.constants';
export { DISPATCH_SERVICE_RMQ };

/**
 * Feature module encapsulating all components related to Rider Management and Dispatch.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Rider]),
    ClientsModule.registerAsync([
      {
        name: DISPATCH_SERVICE_RMQ,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>(
                'RABBITMQ_URL',
                'amqp://localhost:5672',
              ),
            ],
            queue: 'order_assigned',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [RidersController],
  providers: [RidersService],
  exports: [RidersService],
})
export class RidersModule {}
