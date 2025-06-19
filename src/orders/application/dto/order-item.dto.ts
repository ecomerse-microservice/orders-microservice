import { IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer'; // Import Type

/**
 * @class OrderItemDto
 * @description Defines the shape for an item in the create order payload.
 * Price is NOT included here; it should be fetched from the Product service.
 */
export class OrderItemDto {
  /**
   * @property {string} productId - The ID of the product (UUID).
   * @decorator IsString
   * @decorator IsUUID
   */
  @IsString()
  @IsUUID()
  productId: string;

  /**
   * @property {number} quantity - The quantity of the product.
   * @decorator IsNumber
   * @decorator IsPositive
   * @decorator Type
   */
  @IsNumber()
  @IsPositive()
  @Type(() => Number) // Ensure transformation
  quantity: number;

  // Removed price property - Price should be determined server-side
  // based on productId during order creation by querying the product service.
  // price: number;
}