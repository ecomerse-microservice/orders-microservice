import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { Order, OrderItem, OrderStatus, CreateOrderData, MarkOrderAsPaidData, OrderRepositoryPort, PaginatedOrderResult } from '../../domain';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { OrderPaginationDto } from '../../application/dto/order-pagination.dto';

/**
 * @class PrismaOrderRepository
 * @implements OrderRepositoryPort
 * @description Implements order persistence logic using Prisma ORM with SQLite.
 */
@Injectable()
export class PrismaOrderRepository implements OrderRepositoryPort {
  private readonly logger = new Logger(PrismaOrderRepository.name);

  /**
   * @constructor
   * @param {PrismaService} prisma - Injected PrismaService instance.
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Maps a Prisma Order model (with items) to a domain Order entity.
   * @private
   * @param {any} prismaOrder - The order object retrieved from Prisma.
   * @returns {Order} The corresponding domain Order entity.
   */
  private mapToDomain(prismaOrder: any): Order {
    const orderItems = (prismaOrder.OrderItem ?? []).map(item => new OrderItem(
      item.productId,
      item.quantity,
      item.price,
      item.id,
    ));
    return new Order(
      prismaOrder.id,
      prismaOrder.totalAmount,
      prismaOrder.totalItems,
      prismaOrder.status as OrderStatus,
      prismaOrder.paid,
      prismaOrder.paidAt,
      prismaOrder.stripeChargeId,
      orderItems,
      prismaOrder.createdAt,
      prismaOrder.updatedAt,
    );
  }

  /**
   * Creates a new order and its items transactionally using Prisma.
   * @async
   * @param {CreateOrderData} data - Data for the new order and items.
   * @returns {Promise<Order>} The created domain Order entity including its items.
   */
  async create(data: CreateOrderData): Promise<Order> {
    try {
      const order = await this.prisma.order.create({
        data: {
          id: data.id,
          totalAmount: data.totalAmount,
          totalItems: data.totalItems,
          OrderItem: {
            createMany: {
              data: data.items.map(item => ({
                id: item.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
        },
        include: {
          OrderItem: true,
        },
      });
      return this.mapToDomain(order);
    } catch (error: any) {
      this.logger.error(`Error creating order in transaction: ${error.message}`, error.stack);
      throw new RpcException({ status: 500, message: 'Database error creating order.' });
    }
  }


  /**
   * Finds an order by its ID, including its items, using Prisma.
   * @async
   * @param {string} id - The UUID/CUID of the order to find.
   * @returns {Promise<Order | null>} The domain Order entity or null if not found.
   */
  async findById(id: string): Promise<Order | null> {
    try {
      const prismaOrder = await this.prisma.order.findUnique({
        where: { id },
        include: {
          OrderItem: true, // Include items
          OrderReceipt: { // Include receipt if needed later
              select: { receiptUrl: true }
          }
        },
      });
      return prismaOrder ? this.mapToDomain(prismaOrder) : null;
    } catch (error: any) {
      this.logger.error(`Error finding order by ID ${id}: ${error.message}`, error.stack);
      // Return null, let handler decide if it's a 404 or 500
      return null;
    }
  }

  /**
   * Finds all orders with pagination and optional status filter using Prisma.
   * @async
   * @param {OrderPaginationDto} paginationDto - Pagination and filter parameters.
   * @returns {Promise<PaginatedOrderResult>} Paginated list of domain Order entities.
   */
  async findAllPaginated(paginationDto: OrderPaginationDto): Promise<PaginatedOrderResult> {
    const { page = 1, limit = 10, status } = paginationDto;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (status) {
      whereClause.status = status; // Status is mapped to Prisma enum
    }

    try {
      const [totalOrders, prismaOrders] = await this.prisma.$transaction([
        this.prisma.order.count({ where: whereClause }),
        this.prisma.order.findMany({
          skip: skip,
          take: limit,
          where: whereClause,
           include: { // Include items for mapping
                OrderItem: true,
            }
        }),
      ]);

      const lastPage = Math.ceil(totalOrders / limit);
      const domainOrders = prismaOrders.map(order => this.mapToDomain(order));

      return {
        data: domainOrders,
        meta: {
          total: totalOrders,
          page: page,
          lastPage: lastPage,
        },
      };
    } catch (error: any) {
      this.logger.error(`Error finding all orders: ${error.message}`, error.stack);
      throw new RpcException({ status: 500, message: 'Database error finding orders.' });
    }
  }

  /**
   * Updates the status of an existing order using Prisma.
   * @async
   * @param {string} id - The ID of the order to update.
   * @param {OrderStatus} status - The new domain status.
   * @returns {Promise<Order>} The updated domain Order entity.
   */
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
     try {
        const updatedPrismaOrder = await this.prisma.order.update({
            where: { id },
            data: { 
              // Convertir a string y luego usar como enum de Prisma
              status: status.toString() as any 
            },
            include: { OrderItem: true } // Include items for mapping
        });
        return this.mapToDomain(updatedPrismaOrder);
     } catch (error: any) {
         this.logger.error(`Error updating status for order ID ${id}: ${error.message}`, error.stack);
         if (error.code === 'P2025') { // Prisma RecordNotFound code
              throw new RpcException({ status: 404, message: `Order with ID ${id} not found for status update.` });
         }
         throw new RpcException({ status: 500, message: 'Database error updating order status.' });
     }
  }

   /**
    * Marks an order as paid and creates receipt transactionally using Prisma.
    * @async
    * @param {string} id - The ID of the order to mark as paid.
    * @param {MarkOrderAsPaidData} data - Payment and receipt details.
    * @returns {Promise<Order>} The updated domain Order entity.
    */
   async markAsPaid(id: string, data: MarkOrderAsPaidData): Promise<Order> {
       try {
           // Generate UUID for OrderReceipt
           const receiptId = randomUUID();
           this.logger.log(`Generated receipt UUID: ${receiptId} for order ${id}`);
           this.logger.log(`Marking order ${id} as paid with stripeChargeId: ${data.stripeChargeId}`);

           // Use transaction for atomicity
           const updatedPrismaOrder = await this.prisma.order.update({
                where: { id },
                data: {
                    // Convertir explícitamente el enum para evitar problemas de tipado
                    status: OrderStatus.PAID.toString() as any,
                    paid: true,
                    paidAt: new Date(),
                    stripeChargeId: data.stripeChargeId,
                    OrderReceipt: {
                        create: {
                            id: receiptId,
                            receiptUrl: data.receiptUrl,
                        },
                    },
                },
                include: { // Include items and receipt for mapping
                    OrderItem: true,
                    OrderReceipt: { select: { receiptUrl: true } }
                }
            });
           
           this.logger.log(`Successfully updated order ${id} status to PAID`);
           const mappedOrder = this.mapToDomain(updatedPrismaOrder);
           this.logger.debug(`Mapped order status: ${mappedOrder.status}`);
           return mappedOrder;
       } catch (error: any) {
           this.logger.error(`Error marking order ID ${id} as paid: ${error.message}`, error.stack);
            if (error.code === 'P2025') { // Prisma RecordNotFound code
                throw new RpcException({ status: 404, message: `Order with ID ${id} not found to mark as paid.` });
            }
           // Handle potential errors like trying to create receipt if one exists (depends on schema relations)
           throw new RpcException({ status: 500, message: 'Database error marking order as paid.' });
       }
   }
}