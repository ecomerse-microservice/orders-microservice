import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { OrderRepositoryPort, ORDER_REPOSITORY_PORT, PaginatedOrderResult } from '../../../domain';
import { FindAllOrdersQuery } from '../impl/find-all-orders.query';

/**
 * @class FindAllOrdersHandler
 * @description Handles the execution of the FindAllOrdersQuery.
 */
@QueryHandler(FindAllOrdersQuery)
export class FindAllOrdersHandler implements IQueryHandler<FindAllOrdersQuery, PaginatedOrderResult> {
    private readonly logger = new Logger(FindAllOrdersHandler.name);

    /**
     * @constructor
     * @param {OrderRepositoryPort} orderRepository - Injected order repository.
     */
    constructor(
        @Inject(ORDER_REPOSITORY_PORT)
        private readonly orderRepository: OrderRepositoryPort,
    ) {}

    /**
     * Executes the find all orders query.
     * @async
     * @param {FindAllOrdersQuery} query - The query object.
     * @returns {Promise<PaginatedOrderResult>} Paginated list of orders.
     * @throws {RpcException} If an error occurs during retrieval.
     */
    async execute(query: FindAllOrdersQuery): Promise<PaginatedOrderResult> {
        const { orderPaginationDto } = query;
        this.logger.log(`Finding all orders with filter: ${JSON.stringify(orderPaginationDto)}`);

        try {
            const paginatedResult = await this.orderRepository.findAllPaginated(orderPaginationDto);
            return paginatedResult; // Return the structure provided by the repository port
        } catch (error: any) {
             this.logger.error(`Failed to find all orders: ${error.message}`, error.stack);
            throw new RpcException({
                status: 500,
                message: error.message || 'Failed to retrieve orders.',
            });
        }
    }
}