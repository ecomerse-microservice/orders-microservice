import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Order, OrderRepositoryPort, ORDER_REPOSITORY_PORT } from '../../../domain';
import { ChangeOrderStatusCommand } from '../impl/change-order-status.command';

/**
 * @class ChangeOrderStatusHandler
 * @description Handles the execution of the ChangeOrderStatusCommand.
 */
@CommandHandler(ChangeOrderStatusCommand)
export class ChangeOrderStatusHandler implements ICommandHandler<ChangeOrderStatusCommand, Order> {
  private readonly logger = new Logger(ChangeOrderStatusHandler.name);

  /**
   * @constructor
   * @param {OrderRepositoryPort} orderRepository - Injected order repository.
   */
  constructor(
    @Inject(ORDER_REPOSITORY_PORT)
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  /**
   * Executes the change order status command.
   * @async
   * @param {ChangeOrderStatusCommand} command - The command object.
   * @returns {Promise<Order>} The updated order entity.
   * @throws {RpcException} If the order is not found or status change is invalid.
   */
  async execute(command: ChangeOrderStatusCommand): Promise<Order> {
    const { id, status } = command.changeOrderStatusDto;
    this.logger.log(`Attempting to change status of order ID ${id} to ${status}`);

    try {
        // Find the order first (repository findById should handle not found)
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new RpcException({
              status: HttpStatus.NOT_FOUND,
              message: `Order with id ${id} not found`,
            });
        }

        // Optional: Check if status is already the same
        if (order.status === status) {
            this.logger.warn(`Order ${id} already has status ${status}. No change needed.`);
            return order;
        }

        // Attempt to update status via repository
        const updatedOrder = await this.orderRepository.updateStatus(id, status);
        this.logger.log(`Successfully changed status for order ID ${id} to ${status}`);
        return updatedOrder;

    } catch (error: any) {
         if (error instanceof RpcException) {
             throw error;
         }
        this.logger.error(`Failed to change status for order ID ${id}: ${error.message}`, error.stack);
        throw new RpcException({
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error.message || 'Failed to change order status.',
        });
    }
  }
}