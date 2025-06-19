import { Order } from '../model/order.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderPaginationDto } from 'src/orders/application/dto';

/**
 * @interface CreateOrderData
 * @description Data required to create an order.
 */
export interface CreateOrderData {
    id: string;
    totalAmount: number;
    totalItems: number;
        items: {
        id: string;
        productId: string;
        quantity: number;
        price: number;
    }[];
}

/**
 * @interface MarkOrderAsPaidData
 * @description Data required when marking an order as paid.
 */
export interface MarkOrderAsPaidData {
    stripeChargeId: string;
    receiptUrl: string;
}

/**
 * @interface PaginatedOrderResult
 * @description Structure for returning paginated order data.
 */
export interface PaginatedOrderResult {
    data: Order[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
    };
}

/**
 * @interface OrderRepositoryPort
 * @description Defines the contract for order repository adapters.
 */
export interface OrderRepositoryPort {
    /**
     * Creates a new order and its items transactionally.
     * @async
     * @param {CreateOrderData} data - Data for the new order and items.
     * @returns {Promise<Order>} The created order entity including its items.
     */
    create(data: CreateOrderData): Promise<Order>;

    /**
     * Finds an order by its ID, including its items.
     * @async
     * @param {string} id - The UUID/CUID of the order to find.
     * @returns {Promise<Order | null>} The order entity or null if not found.
     */
    findById(id: string): Promise<Order | null>;

    /**
     * Finds all orders with pagination, optionally filtering by status.
     * @async
     * @param {OrderPaginationDto} paginationDto - Pagination and status filter parameters.
     * @returns {Promise<PaginatedOrderResult>} Paginated list of orders.
     */
    findAllPaginated(paginationDto: OrderPaginationDto): Promise<PaginatedOrderResult>;

    /**
     * Updates the status of an existing order.
     * @async
     * @param {string} id - The ID of the order to update.
     * @param {OrderStatus} status - The new status.
     * @returns {Promise<Order>} The updated order entity.
     * @throws {Error} If the order to update is not found.
     */
    updateStatus(id: string, status: OrderStatus): Promise<Order>;

     /**
      * Marks an order as paid, updating status, paid status, timestamps,
      * charge ID, and creating an order receipt transactionally.
      * @async
      * @param {string} id - The ID of the order to mark as paid.
      * @param {MarkOrderAsPaidData} data - Payment and receipt details.
      * @returns {Promise<Order>} The updated order entity.
      * @throws {Error} If the order is not found or cannot be marked as paid.
      */
     markAsPaid(id: string, data: MarkOrderAsPaidData): Promise<Order>;
}

/**
 * @const {string} ORDER_REPOSITORY_PORT
 * @description Injection token for the OrderRepositoryPort.
 */
export const ORDER_REPOSITORY_PORT = 'OrderRepositoryPort';