import { Order } from '../model/order.entity';

/**
 * @interface PaymentSession
 * @description Represents the information needed to initiate a payment session.
 */
export interface PaymentSession {
  id: string; // e.g., Stripe Session ID
  url: string; // e.g., Stripe Checkout URL
  // Add other relevant fields if needed
}

/**
 * @interface PaymentServicePort
 * @description Defines the contract for external communication with the payment service.
 */
export interface PaymentServicePort {
  /**
   * Creates a payment session for a given order.
   * @async
   * @param {Order} order - The order entity containing items and totals.
   * @returns {Promise<PaymentSession>} A promise resolving with the payment session details.
   * @throws {Error} If communication fails or session creation fails.
   */
  createPaymentSession(order: Order): Promise<PaymentSession>;
}

/**
 * @const {string} PAYMENT_SERVICE_PORT
 * @description Injection token for the PaymentServicePort.
 */
export const PAYMENT_SERVICE_PORT = 'PaymentServicePort';