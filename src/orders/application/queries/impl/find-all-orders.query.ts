import { OrderPaginationDto } from '../../dto/order-pagination.dto';

/**
 * @class FindAllOrdersQuery
 * @description Represents the intent to find orders based on pagination and status filter.
 */
export class FindAllOrdersQuery {
  /**
   * @constructor
   * @param {OrderPaginationDto} orderPaginationDto - Pagination and filter parameters.
   */
  constructor(public readonly orderPaginationDto: OrderPaginationDto) {}
}