import { Injectable, Inject, Logger, HttpStatus } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { ProductServicePort, ProductValidationInfo } from 'src/orders/domain';

/**
 * @class NatsProductServiceAdapter
 * @implements ProductServicePort
 * @description Communicates with the Product microservice via NATS.
 */
@Injectable()
export class NatsProductServiceAdapter implements ProductServicePort {
  private readonly logger = new Logger(NatsProductServiceAdapter.name);

  /**
   * @constructor
   * @param {ClientProxy} client - Injected NATS client proxy.
   */
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  /**
   * Sends a validation request to the Product service via NATS.
   * @async
   * @param {string[]} ids - An array of product IDs to validate.
   * @returns {Promise<ProductValidationInfo[]>} Validated product details.
   * @throws {RpcException} If communication fails or validation returns an error.
   */
  async validateProductsByIds(ids: string[]): Promise<ProductValidationInfo[]> {
    this.logger.log(`Sending validate_products request for IDs: ${ids.join(', ')}`);
    try {
      // Ensure the product service returns data matching ProductValidationInfo structure
      const products = await firstValueFrom(
        this.client.send<ProductValidationInfo[], string[]>({ cmd: 'validate_products' }, ids)
      );
       this.logger.log(`Received validation response for ${products.length} products.`);
      return products;
    } catch (error: any) {
      this.logger.error(`Error validating products via NATS: ${error.message || error}`, error.stack);
      // Handle potential RpcExceptions from the product service or communication errors
      throw new RpcException({
        status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Failed to validate products with Product Service.',
      });
    }
  }
}