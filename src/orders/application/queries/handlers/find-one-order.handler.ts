import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Order, OrderRepositoryPort, ORDER_REPOSITORY_PORT, ProductServicePort, PRODUCT_SERVICE_PORT, OrderItem } from '../../../domain';
import { FindOneOrderQuery } from '../impl/find-one-order.query';

/**
 * @class FindOneOrderHandler
 * @description Handles the execution of the FindOneOrderQuery, enriching items with product names.
 */
@QueryHandler(FindOneOrderQuery)
export class FindOneOrderHandler implements IQueryHandler<FindOneOrderQuery, Order> {
  private readonly logger = new Logger(FindOneOrderHandler.name);

  /**
   * @constructor
   * @param {OrderRepositoryPort} orderRepository - Injected order repository.
   * @param {ProductServicePort} productService - Injected product service port.
   */
  constructor(
    @Inject(ORDER_REPOSITORY_PORT)
    private readonly orderRepository: OrderRepositoryPort,
    @Inject(PRODUCT_SERVICE_PORT)
    private readonly productService: ProductServicePort,
  ) {}

  /**
   * Executes the find one order query.
   * @async
   * @param {FindOneOrderQuery} query - The query object containing the order ID.
   * @returns {Promise<Order>} The found order entity, with item names populated.
   * @throws {RpcException} If the order is not found or product details cannot be fetched.
   */
  async execute(query: FindOneOrderQuery): Promise<Order> {
    const { id } = query;
    this.logger.log(`Finding order with ID: ${id}`);

    try {
      const order = await this.orderRepository.findById(id);

      if (!order) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Order with id ${id} not found`,
        });
      }

      if (!order.items || order.items.length === 0) {
          this.logger.warn(`Order ${id} found but has no items.`);
          return order; // Return order without items if none exist
      }

      // Enrich with Product Names
      const productIds = order.items.map((item) => item.productId);
      this.logger.log(`Workspaceing product details for order ${id}, IDs: ${productIds.join(', ')}`);
      const productsInfo = await this.productService.validateProductsByIds(productIds);
      const productMap = new Map(productsInfo.map(p => [p.id, p.name]));

      // Create new Order with enriched items
      const enrichedItems = order.items.map(item => {
        const productName = productMap.get(item.productId) || 'Unknown Product';
        // Create a new OrderItem with the product name
        return new OrderItem(
          item.productId,
          item.quantity,
          item.price,
          productName,
          item.id
        );
      });
      
      // Create a new order with the enriched items
      const enrichedOrder = new Order(
        order.id,
        order.totalAmount,
        order.totalItems,
        order.status,
        order.paid,
        order.paidAt,
        order.stripeChargeId,
        enrichedItems,
        order.createdAt,
        order.updatedAt
      );

      return enrichedOrder;

    } catch (error: any) {
        if (error instanceof RpcException) {
            throw error;
        }
       this.logger.error(`Failed to find order ID ${id} or enrich items: ${error.message}`, error.stack);
       throw new RpcException({
           status: 500,
           message: error.message || 'Failed to retrieve order details.',
       });
    }
  }
}