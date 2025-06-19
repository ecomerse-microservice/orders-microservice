import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NATS_SERVICE, envs } from '../config'; // Adjust path if needed

/**
 * @module NatsModule
 * @description Configures the NATS client connection using ClientsModule
 * and makes it available for injection using the NATS_SERVICE token.
 */
@Module({
  imports: [
    ClientsModule.register([
      {
        name: NATS_SERVICE, // Token used for injection
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers, // Get servers from environment config
        },
      },
    ]),
  ],
  exports: [
     // Export the configured ClientsModule so other modules can inject the client
    ClientsModule.register([
      {
        name: NATS_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
        },
      },
    ]),
  ],
})
export class NatsModule {}