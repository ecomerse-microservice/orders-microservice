import { Injectable, Inject, Logger, HttpStatus } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { Order, PaymentServicePort, PaymentSession } from 'src/orders/domain';

/**
 * @class NatsPaymentServiceAdapter
 * @implements PaymentServicePort
 * @description Communicates with a Payment microservice via NATS.
 */
@Injectable()
export class NatsPaymentServiceAdapter implements PaymentServicePort {
  private readonly logger = new Logger(NatsPaymentServiceAdapter.name);

  /**
   * @constructor
   * @param {ClientProxy} client - Injected NATS client proxy.
   */
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  /**
   * Sends a request to create a payment session via NATS.
   * @async
   * @param {Order} order - The order for which to create the session.
   * @returns {Promise<PaymentSession>} Payment session details.
   * @throws {RpcException} If communication or session creation fails.
   */
  async createPaymentSession(order: Order): Promise<PaymentSession> {
    const payload = {
      orderId: order.id,
      currency: 'usd', // Consider making currency configurable
      items: order.items.map(item => ({
        name: item.name || `Product #${item.productId}`, // Use fetched name if available
        price: item.price,
        quantity: item.quantity,
      })),
    };
    this.logger.log(`Sending create.payment.session request for Order ID: ${order.id}`);

    try {
      const session = await firstValueFrom(
        this.client.send<PaymentSession>('create.payment.session', payload)
      );
      this.logger.log(`Received payment session response for Order ID: ${order.id}, Session ID: ${session.id}`);
      return session;
    } catch (error: any) {
      this.logger.error(`Error creating payment session via NATS for Order ID ${order.id}: ${error.message || error}`, error.stack);
      throw new RpcException({
        status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Failed to create payment session with Payment Service.',
      });
    }
  }
}