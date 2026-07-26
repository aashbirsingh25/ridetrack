import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RidersModule } from './riders/riders.module';
import { Rider } from './riders/entities/rider.entity';

/**
 * Root Module of rider-dispatch-service.
 * Configures Environment Variables and TypeORM connection to PostgreSQL.
 */
@Module({
  imports: [
    // Load environment variables globally from .env file
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Asynchronously connect to PostgreSQL using ConfigService & TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>(
          'DATABASE_URL',
          'postgresql://postgres:postgres@localhost:5432/rider_db',
        ),
        entities: [Rider],
        autoLoadEntities: true,
        synchronize: true, // Automatically synchronize entity schema with database table in dev
      }),
      inject: [ConfigService],
    }),

    // Rider Feature Module
    RidersModule,
  ],
})
export class AppModule {}
