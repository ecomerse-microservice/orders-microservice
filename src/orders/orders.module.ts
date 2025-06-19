import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Application Layer
import { CommandHandlers } from './application/commands';
import { QueryHandlers } from './application/queries';

// Domain Layer (Ports)
import { ORDER_REPOSITORY_PORT, PRODUCT_SERVICE_PORT, PAYMENT_SERVICE_PORT } from './domain';

// Infrastructure Layer (Adapters & Controller)
import { PrismaOrderRepository } from './infrastructure/adapters/prisma-order.repository';
import { NatsProductServiceAdapter } from './infrastructure/adapters/nats-product.service.adapter';
import { NatsPaymentServiceAdapter } from './infrastructure/adapters/nats-payment.service.adapter';
import { OrdersController } from './infrastructure/controllers/orders.controller';
import { NatsModule } from 'src/transports/nats.module';

/**
 * @const {Provider[]} infrastructureProviders
 * @description Provides the implementations for the domain ports.
 */
const infrastructureProviders: Provider[] = [
  {
    provide: ORDER_REPOSITORY_PORT,
    useClass: PrismaOrderRepository,
  },
  {
    provide: PRODUCT_SERVICE_PORT,
    useClass: NatsProductServiceAdapter, // Use NATS adapter for Product Service
  },
  {
      provide: PAYMENT_SERVICE_PORT,
      useClass: NatsPaymentServiceAdapter, // Use NATS adapter for Payment Service
  }
];

/**
 * @const {Provider[]} applicationProviders
 * @description Registers command and query handlers with CQRS.
 */
const applicationProviders: Provider[] = [
    ...CommandHandlers,
    ...QueryHandlers,
];

/**
 * @module OrdersModule
 * @description Encapsulates the orders feature.
 */
@Module({
  imports: [
    CqrsModule,
    NatsModule,
  ],
  controllers: [OrdersController],
  providers: [
    ...applicationProviders,
    ...infrastructureProviders,
  ],
})
export class OrdersModule {}