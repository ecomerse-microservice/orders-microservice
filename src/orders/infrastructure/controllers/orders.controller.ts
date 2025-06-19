import { Controller, Logger, ParseUUIDPipe } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import { CreateOrderDto, ChangeOrderStatusDto, PaidOrderDto, OrderPaginationDto, CreateOrderResponseDto } from '../../application/dto';
import { PaginatedOrderResult, Order, OrderStatus } from '../../domain';

import { CreateOrderCommand } from '../../application/commands/impl/create-order.command';
import { ChangeOrderStatusCommand } from '../../application/commands/impl/change-order-status.command';
import { MarkOrderAsPaidCommand } from '../../application/commands/impl/mark-order-as-paid.command';
import { FindAllOrdersQuery } from '../../application/queries/impl/find-all-orders.query';
import { FindOneOrderQuery } from '../../application/queries/impl/find-one-order.query';


/**
 * @class OrdersController
 * @description Handles incoming NATS messages/events for order operations.
 * Delegates tasks to CommandBus and QueryBus.
 */
@Controller()
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  /**
   * @constructor
   * @param {CommandBus} commandBus - Injected CommandBus.
   * @param {QueryBus} queryBus - Injected QueryBus.
   */
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Handles 'createOrder' message pattern.
   * @param {CreateOrderDto} createOrderDto - Order creation data.
   * @returns {Promise<CreateOrderResponseDto>} Created order and payment session details.
   */
  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto): Promise<CreateOrderResponseDto> {
    this.logger.log(`Received createOrder request: ${JSON.stringify(createOrderDto)}`);
    return this.commandBus.execute<CreateOrderCommand, CreateOrderResponseDto>(
      new CreateOrderCommand(createOrderDto),
    );
    // Errors handled by global filter
  }

  /**
   * Handles 'findAllOrders' message pattern.
   * @param {OrderPaginationDto} orderPaginationDto - Pagination and filtering options.
   * @returns {Promise<PaginatedOrderResult>} Paginated list of orders.
   */
  @MessagePattern('findAllOrders')
  async findAll(@Payload() orderPaginationDto: OrderPaginationDto): Promise<PaginatedOrderResult> {
    this.logger.log(`Received findAllOrders request: ${JSON.stringify(orderPaginationDto)}`);
    return this.queryBus.execute<FindAllOrdersQuery, PaginatedOrderResult>(
      new FindAllOrdersQuery(orderPaginationDto),
    );
  }

  /**
   * Handles 'findOneOrder' message pattern.
   * @param {string} id - Order ID (UUID/CUID) from payload.
   * @returns {Promise<Order>} The found order with enriched items.
   */
  @MessagePattern('findOneOrder')
  async findOne(@Payload('id', ParseUUIDPipe) id: string): Promise<Order> {
      // Note: Use ParseUUIDPipe if ID is UUID, adjust if using CUID
      this.logger.log(`Received findOneOrder request for ID: ${id}`);
      return this.queryBus.execute<FindOneOrderQuery, Order>(
          new FindOneOrderQuery(id),
      );
  }

  /**
   * Handles 'changeOrderStatus' message pattern.
   * @param {ChangeOrderStatusDto} changeOrderStatusDto - DTO with order ID and new status.
   * @returns {Promise<Order>} The updated order.
   */
  @MessagePattern('changeOrderStatus')
  async changeOrderStatus(@Payload() changeOrderStatusDto: ChangeOrderStatusDto): Promise<Order> {
    this.logger.log(`Received changeOrderStatus request: ${JSON.stringify(changeOrderStatusDto)}`);
    return this.commandBus.execute<ChangeOrderStatusCommand, Order>(
      new ChangeOrderStatusCommand(changeOrderStatusDto),
    );
  }

  /**
   * Handles 'payment.succeeded' event pattern.
   * @param {PaidOrderDto} paidOrderDto - Data about the successful payment.
   * @returns {Promise<Order>} The order marked as paid.
   */
  @EventPattern('payment.succeeded')
  async paidOrder(@Payload() paidOrderDto: PaidOrderDto): Promise<Order | void> {
      // Event handlers typically don't return values over NATS events
      // But the command handler will return the updated order.
      // Log receipt of the event.
      this.logger.log(`Received payment.succeeded event: ${JSON.stringify(paidOrderDto)}`);
      try {
          return await this.commandBus.execute<MarkOrderAsPaidCommand, Order>(
              new MarkOrderAsPaidCommand(paidOrderDto),
          );
      } catch(error: any) {
          // Log error, but don't throw RpcException for an EventPattern handler
          // as there's no client waiting for a response/error.
          this.logger.error(`Error processing payment.succeeded event for order ${paidOrderDto.orderId}: ${error.message}`, error.stack);
      }
  }

  /**
   * Handles 'payment.cancelled' event pattern.
   * @param {object} cancelledPaymentDto - Data about the cancelled payment.
   * @returns {Promise<Order>} The order marked as cancelled.
   */
  @EventPattern('payment.cancelled')
  async cancelledOrder(@Payload() cancelledPaymentDto: { orderId: string, paymentId: string, cancelledAt: string, reason: string }): Promise<Order | void> {
      this.logger.log(`Received payment.cancelled event: ${JSON.stringify(cancelledPaymentDto)}`);
      try {
          return await this.commandBus.execute<ChangeOrderStatusCommand, Order>(
              new ChangeOrderStatusCommand({
                  id: cancelledPaymentDto.orderId,
                  status: OrderStatus.CANCELLED,
                  metadata: {
                      cancelledAt: cancelledPaymentDto.cancelledAt,
                      paymentId: cancelledPaymentDto.paymentId,
                      reason: cancelledPaymentDto.reason
                  }
              }),
          );
      } catch(error: any) {
          this.logger.error(`Error processing payment.cancelled event for order ${cancelledPaymentDto.orderId}: ${error.message}`, error.stack);
      }
  }

  /**
   * Handles 'payment.refunded' event pattern.
   * @param {object} refundedPaymentDto - Data about the refunded payment.
   * @returns {Promise<Order>} The order marked as refunded.
   */
  @EventPattern('payment.refunded')
  async refundedOrder(@Payload() refundedPaymentDto: { orderId: string, paymentId: string, refundId: string, amount: number, refundedAt: string, reason: string }): Promise<Order | void> {
      this.logger.log(`Received payment.refunded event: ${JSON.stringify(refundedPaymentDto)}`);
      try {
          return await this.commandBus.execute<ChangeOrderStatusCommand, Order>(
              new ChangeOrderStatusCommand({
                  id: refundedPaymentDto.orderId,
                  status: OrderStatus.REFUNDED,
                  metadata: {
                      refundedAt: refundedPaymentDto.refundedAt,
                      paymentId: refundedPaymentDto.paymentId,
                      refundId: refundedPaymentDto.refundId,
                      amount: refundedPaymentDto.amount,
                      reason: refundedPaymentDto.reason
                  }
              }),
          );
      } catch(error: any) {
          this.logger.error(`Error processing payment.refunded event for order ${refundedPaymentDto.orderId}: ${error.message}`, error.stack);
      }
  }

  /**
   * Handles 'payment.failed' event pattern.
   * @param {object} failedPaymentDto - Data about the failed payment.
   * @returns {Promise<Order>} The order marked as payment failed.
   */
  @EventPattern('payment.failed')
  async failedPaymentOrder(@Payload() failedPaymentDto: { orderId: string, paymentId: string, failureReason: string }): Promise<Order | void> {
      this.logger.log(`Received payment.failed event: ${JSON.stringify(failedPaymentDto)}`);
      try {
          return await this.commandBus.execute<ChangeOrderStatusCommand, Order>(
              new ChangeOrderStatusCommand({
                  id: failedPaymentDto.orderId,
                  status: OrderStatus.CANCELLED,
                  metadata: {
                      failedAt: new Date().toISOString(),
                      paymentId: failedPaymentDto.paymentId,
                      reason: failedPaymentDto.failureReason
                  }
              }),
          );
      } catch(error: any) {
          this.logger.error(`Error processing payment.failed event for order ${failedPaymentDto.orderId}: ${error.message}`, error.stack);
      }
  }
}