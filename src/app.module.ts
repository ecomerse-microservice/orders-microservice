import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';

/**
 * @module AppModule
 * @description The root module, importing feature and shared modules.
 */
@Module({
  imports: [
      PrismaModule, // Provides PrismaService globally
      OrdersModule,
    ],
  controllers: [],
  providers: [],
})
export class AppModule {}