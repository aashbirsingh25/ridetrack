import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RidersController } from './riders.controller';
import { RidersService } from './riders.service';
import { Rider } from './entities/rider.entity';

/**
 * Feature module encapsulating all components related to Rider Management and Dispatch.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Rider])],
  controllers: [RidersController],
  providers: [RidersService],
  exports: [RidersService],
})
export class RidersModule {}
