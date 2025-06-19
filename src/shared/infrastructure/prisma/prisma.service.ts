import { Injectable, OnModuleInit, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * @class PrismaService
 * @extends PrismaClient
 * @implements OnModuleInit
 * @implements OnModuleDestroy
 * @description Manages the Prisma client lifecycle (connection/disconnection) for SQLite.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * @async
   * @method onModuleInit
   * @description Connects to the SQLite database when the module initializes.
   */
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to the SQLite database (Prisma)');
    } catch (error) {
      this.logger.error('Failed to connect to the SQLite database (Prisma)', error);
      // throw error; // Optional: Stop application if DB connection fails
    }
  }

  /**
   * @async
   * @method onModuleDestroy
   * @description Disconnects from the SQLite database when the application shuts down.
   */
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Successfully disconnected from the SQLite database (Prisma)');
  }
}