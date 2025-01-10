import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { EmailModule } from '../src/email.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(EmailModule);
  const configService = app.get(ConfigService);

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configure microservice
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('amqp.url')],
      queue: configService.get<string>('amqp.email_exchange'),
      queueOptions: {
        durable: true,
      },

      noAck: false,
      prefetchCount: 5,
    },
    // Add message pattern configuration
    socketOptions: {
      heartbeatIntervalInSeconds: 60,
      reconnectTimeInSeconds: 5,
    },
    // Add pattern matching options
    messagePatternKeys: ['cmd'],
  });

  // Start microservice and HTTP server
  try {
    await app.startAllMicroservices();
    await app.listen(3000);
    logger.log(`Email microservice is running on port 3000`);
    logger.log(
      `RabbitMQ connected to ${configService.get<string>('amqp.url')}`,
    );
  } catch (error) {
    logger.error('Failed to start the application:', error);
    process.exit(1);
  }
}

bootstrap();
