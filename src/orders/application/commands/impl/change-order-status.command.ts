import { ChangeOrderStatusDto } from '../../dto/change-order-status.dto';

/**
 * @class ChangeOrderStatusCommand
 * @description Represents the intent to change the status of an order.
 */
export class ChangeOrderStatusCommand {
  /**
   * @constructor
   * @param {ChangeOrderStatusDto} changeOrderStatusDto - Data containing order ID and new status.
   */
  constructor(public readonly changeOrderStatusDto: ChangeOrderStatusDto) {}
}