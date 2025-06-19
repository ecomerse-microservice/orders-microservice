/**
 * @enum {string} OrderStatus
 * @description Represents the possible statuses of an order.
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID', // Added explicit PAID status
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

// Helper array for validation if needed, mirroring the enum values
export const OrderStatusList = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
  OrderStatus.PAYMENT_FAILED,
];