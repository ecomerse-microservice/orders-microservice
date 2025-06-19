import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import {
  OrderRepositoryPort, ORDER_REPOSITORY_PORT,
  ProductServicePort, PRODUCT_SERVICE_PORT, ProductValidationInfo,
  PaymentServicePort, PAYMENT_SERVICE_PORT,
  RepositoryCreateOrderData as CreateOrderData, Order, PaymentSession
} from '../../../domain';
import { CreateOrderCommand } from '../impl/create-order.command';
import { CreateOrderResponseDto } from '../../dto';

/**
 * @class CreateOrderHandler
 * @description Handles the execution of the CreateOrderCommand.
 */
@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand, CreateOrderResponseDto> {
  private readonly logger = new Logger(CreateOrderHandler.name);

  /**
   * @constructor
   * @param {OrderRepositoryPort} orderRepository - Injected order repository.
   * @param {ProductServicePort} productService - Injected product service port implementation.
   * @param {PaymentServicePort} paymentService - Injected payment service port implementation.
   */
  constructor(
    @Inject(ORDER_REPOSITORY_PORT)
    private readonly orderRepository: OrderRepositoryPort,
    @Inject(PRODUCT_SERVICE_PORT)
    private readonly productService: ProductServicePort,
    @Inject(PAYMENT_SERVICE_PORT)
    private readonly paymentService: PaymentServicePort,
  ) {}

  /**
   * Executes the create order command.
   * @async
   * @param {CreateOrderCommand} command - The command object.
   * @returns {Promise<CreateOrderResponseDto>} Object containing the created order and payment session details.
   * @throws {RpcException} If product validation fails, creation fails, or payment session creation fails.
   */
  async execute(command: CreateOrderCommand): Promise<CreateOrderResponseDto> {
    const { userId = 'anonymous', items } = command.createOrderDto;
    this.logger.log(`Received CreateOrderCommand with ${items.length} items for user ${userId}`);

    // 1. Extract Product IDs
    const productIds = items.map((item) => item.productId.toString());

    try {
        // 2. Validate Products via Product Service Port
        this.logger.log('Validating products...');
        const validatedProducts: ProductValidationInfo[] = await this.productService.validateProductsByIds(productIds);
        this.logger.log('Products validated successfully.');

        // Map validated products by ID for easy lookup
        const productMap = new Map(validatedProducts.map(p => [p.id, p]));

        // 3. Calculate Totals & Prepare Order Items with validated prices
        let totalAmount = 0;
        let totalItems = 0;
        const orderItemsData: CreateOrderData['items'] = items.map(orderItem => {
            const productIdString = orderItem.productId.toString();
            const product = productMap.get(productIdString);
            if (!product) {
                // This case should theoretically be caught by validateProductsByIds, but belt-and-suspenders
                throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: `Product ID ${productIdString} not found after validation.`});
            }
            if (!product.available) {
                throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: `Product '${product.name}' (ID: ${product.id}) is not available.`});
            }

            totalAmount += product.price * orderItem.quantity;
            totalItems += orderItem.quantity;

            // Generate UUID for each order item
            const itemId = randomUUID();
            this.logger.log(`Generated order item UUID: ${itemId}`);

            return {
                id: itemId,
                productId: productIdString,
                quantity: orderItem.quantity,
                price: product.price, // Use validated price
            };
        });

        // 4. Create Order in Repository (Transaction handled within repository implementation)
        this.logger.log('Creating order in repository...');
        
        // Generate UUID for the order
        const orderId = randomUUID();
        this.logger.log(`Generated order UUID: ${orderId}`);

        const orderData: CreateOrderData = {
            id: orderId,
            userId: userId,
            totalAmount: totalAmount,
            totalItems: totalItems,
            items: orderItemsData,
        };
        const createdOrder: Order = await this.orderRepository.create(orderData);
        this.logger.log(`Order created successfully with ID: ${createdOrder.id}`);

        // 5. Create Payment Session via Payment Service Port
        this.logger.log('Creating payment session...');
        const paymentSession: PaymentSession = await this.paymentService.createPaymentSession(createdOrder);
        this.logger.log(`Payment session created: ${paymentSession.id}`);

        // 6. Return combined result
        return {
            id: createdOrder.id.toString(),
            order: createdOrder,
            paymentSession: paymentSession,
        };

    } catch (error: any) {
      this.logger.error(`Failed to create order: ${error.message}`, error.stack);
      // Re-throw RpcExceptions, wrap others
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An internal error occurred while creating the order.',
      });
    }
  }
}