import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { envs } from './config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './shared/infrastructure/filters/rpc-exception.filter';
import { ResponseSanitizerInterceptor } from './shared/infrastructure/interceptors/response-sanitizer.interceptor';

/**
 * @function bootstrap
 * @description Initializes and starts the Orders microservice.
 * @async
 */
async function bootstrap() {
  const logger = new Logger('Main-OrdersMS');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: envs.natsServers,
      },
    },
  );

  // Apply global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Apply Global Shared Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());
  logger.log('Applied global RPC exception filter.');

  // Apply Global Shared Interceptor
  app.useGlobalInterceptors(new ResponseSanitizerInterceptor());
  logger.log('Applied global response sanitizer interceptor.');

  await app.listen();
  logger.log(`Orders Microservice is listening on NATS servers: ${envs.natsServers.join(', ')}`);
}
bootstrap();