import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

/**
 * Bootstrap entry point for delivery-order-service NestJS application.
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for cross-origin frontend access
  app.enableCors();

  // Enable global validation pipe for DTO validation and transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not defined in DTO
      transform: true, // Automatically transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);
  logger.log(`🚀 Delivery Order Service is running on port: ${port}`);
}

bootstrap();
