/**
 * @class OrderReceipt
 * @description Represents the receipt details for a paid order.
 */
export class OrderReceipt {
  /**
   * @property {string} orderId - The ID of the order this receipt belongs to.
   */
  public readonly orderId: string;

  /**
   * @property {string} receiptUrl - The URL where the payment receipt can be viewed.
   */
  public readonly receiptUrl: string;

  /**
   * @property {Date} createdAt - Timestamp when the receipt was recorded.
   */
  public readonly createdAt: Date;


  /**
   * @constructor
   * @param {string} orderId
   * @param {string} receiptUrl
   * @param {Date} [createdAt] - Defaults to now if not provided.
   */
  constructor(orderId: string, receiptUrl: string, createdAt?: Date) {
    if (!receiptUrl) {
        throw new Error('Receipt URL cannot be empty.');
    }
    this.orderId = orderId;
    this.receiptUrl = receiptUrl;
    this.createdAt = createdAt || new Date();
  }
}