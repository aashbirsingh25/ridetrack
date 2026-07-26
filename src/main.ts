import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable global CORS
  app.enableCors();

  // Enable global validation pipes for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3002);

  await app.listen(port);
  logger.log(`🚀 Live Tracking Service is running on port: ${port}`);
  logger.log(`📡 WebSocket Gateway ready for Socket.io connections at ws://localhost:${port}`);
  logger.log(`🔗 REST API available at http://localhost:${port}/tracking/:orderId/location`);
}

bootstrap();
