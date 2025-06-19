import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './order-item.dto';

/**
 * @class CreateOrderDto
 * @description Defines the shape of data for creating a new order.
 */
export class CreateOrderDto {
  /**
   * @property {string} userId - ID of the user creating the order. Optional, defaults to 'anonymous' if not provided.
   * @decorator IsString
   * @decorator IsOptional
   */
  @IsString()
  @IsOptional()
  userId?: string;

  /**
   * @property {OrderItemDto[]} items - Array of items in the order. Must contain at least one item.
   * @decorator IsArray
   * @decorator ArrayMinSize
   * @decorator ValidateNested
   * @decorator Type
   */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}