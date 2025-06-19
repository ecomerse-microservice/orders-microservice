import { OrderStatus } from './order-status.enum';
import { OrderItem } from './order-item.entity';

/**
 * @class Order
 * @description Represents an order within the application domain.
 */
export class Order {
  /**
   * @property {string} id - The unique identifier for the order (UUID/CUID).
   */
  public readonly id: string;

  /**
   * @property {number} totalAmount - The total calculated amount for the order.
   */
  public totalAmount: number;

  /**
   * @property {number} totalItems - The total number of items in the order.
   */
  public totalItems: number;

  /**
   * @property {OrderStatus} status - The current status of the order.
   */
  public status: OrderStatus;

  /**
   * @property {boolean} paid - Flag indicating if the order has been paid.
   */
  public paid: boolean;

  /**
   * @property {Date | null} paidAt - Timestamp when the order was marked as paid.
   */
  public paidAt: Date | null;

  /**
   * @property {string | null} stripeChargeId - The charge ID from the payment provider (e.g., Stripe).
   */
  public stripeChargeId: string | null;

   /**
    * @property {OrderItem[]} items - The items included in the order.
    */
   public items: OrderItem[];

   /**
   * @property {Date} createdAt - Timestamp of order creation.
   */
    public readonly createdAt: Date;

   /**
   * @property {Date} updatedAt - Timestamp of last update.
   */
    public updatedAt: Date;


  /**
   * @constructor
   * @param {string} id
   * @param {number} totalAmount
   * @param {number} totalItems
   * @param {OrderStatus} status
   * @param {boolean} paid
   * @param {Date | null} paidAt
   * @param {string | null} stripeChargeId
   * @param {OrderItem[]} items
   * @param {Date} createdAt
   * @param {Date} updatedAt
   */
  constructor(
    id: string,
    totalAmount: number,
    totalItems: number,
    status: OrderStatus,
    paid: boolean,
    paidAt: Date | null,
    stripeChargeId: string | null,
    items: OrderItem[],
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.totalAmount = totalAmount;
    this.totalItems = totalItems;
    this.status = status;
    this.paid = paid;
    this.paidAt = paidAt;
    this.stripeChargeId = stripeChargeId;
    this.items = items || [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * @method changeStatus
   * @description Changes the order status if valid.
   * @param {OrderStatus} newStatus - The new status to set.
   */
  public changeStatus(newStatus: OrderStatus): void {
    // Add domain logic here for valid status transitions if needed
    // e.g., cannot change from PAID to PENDING
    if (this.status === OrderStatus.CANCELLED || this.status === OrderStatus.DELIVERED) {
        throw new Error(`Cannot change status from ${this.status}`);
    }
     if (!Object.values(OrderStatus).includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
     }
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  /**
   * @method markAsPaid
   * @description Marks the order as paid and updates relevant details.
   * @param {string} chargeId - The payment provider's charge ID.
   */
  public markAsPaid(chargeId: string): void {
    if (this.paid) {
        throw new Error('Order is already paid.');
    }
    if (this.status !== OrderStatus.PENDING) {
        // Or maybe allow payment on other statuses depending on logic
        // throw new Error('Order must be PENDING to be marked as paid.');
    }
    this.paid = true;
    this.paidAt = new Date();
    this.status = OrderStatus.PAID;
    this.stripeChargeId = chargeId;
    this.updatedAt = new Date();
  }

  public canChangeStatus(newStatus: OrderStatus): boolean {
    // Validaciones de cambio de estado
    if (this.status === OrderStatus.DELIVERED) {
      return false; // No se puede cambiar una orden entregada
    }
    
    if (this.status === OrderStatus.CANCELLED) {
      return false; // No se puede cambiar una orden cancelada
    }
    
    if (this.status === OrderStatus.PENDING && newStatus === OrderStatus.DELIVERED) {
      return false; // No se puede entregar una orden pendiente sin pagar
    }
    
    return true;
  }
}