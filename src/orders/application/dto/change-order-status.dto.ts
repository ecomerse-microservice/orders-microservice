import { IsEnum, IsUUID, IsOptional } from 'class-validator';
import { OrderStatus, OrderStatusList } from '../../domain/enums/order-status.enum';

/**
 * @class ChangeOrderStatusDto
 * @description Defines the shape for the change order status payload.
 */
export class ChangeOrderStatusDto {
  /**
   * @property {string} id - The UUID/CUID of the order.
   * @decorator IsUUID
   */
  @IsUUID(4) // Assuming UUID v4, adjust if using CUID
  id: string;

  /**
   * @property {OrderStatus} status - The new status for the order.
   * @decorator IsEnum
   */
  @IsEnum(OrderStatusList, {
    message: `Valid status are ${OrderStatusList.join(', ')}`
  })
  status: OrderStatus;
  
  /**
   * @property {Record<string, any>} metadata - Additional data related to the status change.
   * @decorator IsOptional
   */
  @IsOptional()
  metadata?: Record<string, any>;
}