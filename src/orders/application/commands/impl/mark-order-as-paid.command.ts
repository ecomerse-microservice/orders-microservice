import { PaidOrderDto } from '../../dto/paid-order.dto';

/**
 * @class MarkOrderAsPaidCommand
 * @description Represents the intent to mark an order as paid, usually triggered by a payment event.
 */
export class MarkOrderAsPaidCommand {
  /**
   * @constructor
   * @param {PaidOrderDto} paidOrderDto - Data received from the payment success event.
   */
  constructor(public readonly paidOrderDto: PaidOrderDto) {}
}