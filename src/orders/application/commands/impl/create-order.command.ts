import { CreateOrderDto } from '../../dto/create-order.dto';

/**
 * @class CreateOrderCommand
 * @description Represents the intent to create a new order.
 */
export class CreateOrderCommand {
  /**
   * @constructor
   * @param {CreateOrderDto} createOrderDto - Data for the new order.
   */
  constructor(public readonly createOrderDto: CreateOrderDto) {}
}