import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto'; // Adjust path
import { OrderStatus, OrderStatusList } from '../../domain/enums/order-status.enum';

/**
 * @class OrderPaginationDto
 * @extends PaginationDto
 * @description Extends common pagination with optional order status filtering.
 */
export class OrderPaginationDto extends PaginationDto {

  /**
   * @property {OrderStatus} [status] - Optional status to filter orders by.
   * @decorator IsOptional
   * @decorator IsEnum
   */
  @IsOptional()
  @IsEnum( OrderStatusList, {
    message: `Valid status are ${ OrderStatusList.join(', ') }`
  })
  status?: OrderStatus;
}