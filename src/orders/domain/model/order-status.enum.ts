/**
 * Enum que representa los estados posibles de una orden.
 * El mismo debe coincidir con los valores en el modelo de Prisma.
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
} 