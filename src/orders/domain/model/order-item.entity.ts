/**
 * @class OrderItem
 * @description Represents an item in an order, with details about quantity and price at time of order.
 */
export class OrderItem {
  /**
   * @property {string} id - The unique identifier for this order item. Usually auto-generated.
   */
  public readonly id?: string;

  /**
   * @property {string} productId - Reference to the product entity from product service (UUID).
   */
  public readonly productId: string;

  /**
   * @property {number} quantity - Number of items ordered.
   */
  public readonly quantity: number;

  /**
   * @property {number} price - Price per unit at the time of ordering.
   */
  public readonly price: number;

  /**
   * @property {string} name - Optional product name cached at time of order.
   */
  public readonly name?: string;

  /**
   * @constructor
   * @param {string} productId - The product ID from the product service.
   * @param {number} quantity - The quantity ordered.
   * @param {number} price - The price per unit at time of order.
   * @param {string} name - Optional product name cached at time of order.
   * @param {string} id - Optional ID for the order item itself.
   */
  constructor(
    productId: string,
    quantity: number,
    price: number,
    name?: string,
    id?: string
  ) {
    if (quantity <= 0) {
      throw new Error('Order item quantity must be positive.');
    }
    if (price < 0) {
      throw new Error('Order item price cannot be negative.');
    }
    this.productId = productId;
    this.quantity = quantity;
    this.price = price;
    this.name = name;
    this.id = id;
  }
}