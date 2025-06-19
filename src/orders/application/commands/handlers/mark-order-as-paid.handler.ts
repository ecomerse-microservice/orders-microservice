import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Order, OrderRepositoryPort, ORDER_REPOSITORY_PORT, MarkOrderAsPaidData } from '../../../domain';
import { MarkOrderAsPaidCommand } from '../impl/mark-order-as-paid.command';

/**
 * @class MarkOrderAsPaidHandler
 * @description Handles the MarkOrderAsPaidCommand, usually triggered by a 'payment.succeeded' event.
 */
@CommandHandler(MarkOrderAsPaidCommand)
export class MarkOrderAsPaidHandler implements ICommandHandler<MarkOrderAsPaidCommand, Order> {
  private readonly logger = new Logger(MarkOrderAsPaidHandler.name);

  /**
   * @constructor
   * @param {OrderRepositoryPort} orderRepository - Injected order repository.
   */
  constructor(
    @Inject(ORDER_REPOSITORY_PORT)
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  /**
   * Executes the mark order as paid command.
   * @async
   * @param {MarkOrderAsPaidCommand} command - The command object containing payment details.
   * @returns {Promise<Order>} The updated order entity marked as paid.
   * @throws {RpcException} If the order is not found, already paid, or update fails.
   */
  async execute(command: MarkOrderAsPaidCommand): Promise<Order> {
    const { orderId, paymentId, stripeChargeId } = command.paidOrderDto;
    this.logger.log(`Processing payment success for order ID: ${orderId}, Payment ID: ${paymentId}`);

    // DTO tiene getters para mantener compatibilidad con código existente
    const paymentData: MarkOrderAsPaidData = { 
      stripeChargeId: stripeChargeId || paymentId, 
      receiptUrl: command.paidOrderDto.receiptUrl 
    };

    try {
        // Logging extenso para depurar
        this.logger.debug(`Sending to repository: orderId=${orderId}, stripeChargeId=${paymentData.stripeChargeId}, receiptUrl=${paymentData.receiptUrl}`);
        
        // The repository method handles finding the order and updating transactionally
        const updatedOrder = await this.orderRepository.markAsPaid(orderId, paymentData);
        this.logger.log(`Order ID ${orderId} successfully marked as PAID.`);
        return updatedOrder;

    } catch (error: any) {
         if (error instanceof RpcException) {
             throw error;
         }
         // Handle specific domain errors potentially thrown by repository (e.g., already paid)
         // For now, wrap generic errors.
        this.logger.error(`Failed to mark order ID ${orderId} as paid: ${error.message}`, error.stack);
        throw new RpcException({
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error.message || 'Failed to update order after payment.',
        });
    }
  }
}