import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

/**
 * Bootstrap entry point for delivery-order-service NestJS hybrid application.
 * Serves HTTP REST API endpoints AND listens to RabbitMQ microservice queue "order_assigned".
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
  const rabbitmqUrl = configService.get<string>(
    'RABBITMQ_URL',
    'amqp://localhost:5672',
  );

  // Connect RabbitMQ microservice listener on queue "order_assigned"
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'order_assigned',
      queueOptions: {
        durable: false,
      },
    },
  });

  // Start all microservices before HTTP server listens
  await app.startAllMicroservices();

  await app.listen(port);
  logger.log(`🚀 Delivery Order Service HTTP REST API running on port: ${port}`);
  logger.log(`🐰 RabbitMQ Microservice Listener connected at ${rabbitmqUrl} (queue: order_assigned)`);
}

bootstrap();
