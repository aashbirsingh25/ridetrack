import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricsModule } from './metrics/metrics.module';
import { OrdersModule } from './orders/orders.module';

/**
 * Root Module of the delivery-order-service.
 * Configures Environment Variables and Async MongoDB Database connection.
 */
@Module({
  imports: [
    MetricsModule,
    // Load environment variables globally from .env file
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Asynchronously connect to MongoDB using ConfigService
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGODB_URI',
          'mongodb://localhost:27017/delivery_db',
        ),
      }),
      inject: [ConfigService],
    }),

    // Order Feature Module
    OrdersModule,
  ],
})
export class AppModule {}
