import { Order } from '../../domain/model/order.entity';
import { PaymentSession } from '../../domain/ports/payment.service.port';

/**
 * @class CreateOrderResponseDto
 * @description Structure of the response after creating an order.
 */
export class CreateOrderResponseDto {
  /**
   * @property {string} id - The ID of the created order.
   */
  id: string;
  
  /**
   * @property {Order} order - The newly created order entity.
   */
  order: Order;

  /**
   * @property {PaymentSession} paymentSession - Details for the payment session.
   */
  paymentSession: PaymentSession;
}