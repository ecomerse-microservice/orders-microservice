import { Order } from '../model/order.entity';
import { OrderStatus } from '../model/order-status.enum';

export interface CreateOrderItemData {
  id: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderData {
  id: string;
  userId: string;
  totalAmount: number;
  totalItems: number;
  items: CreateOrderItemData[];
}

export interface OrderRepository {
  create(orderData: CreateOrderData): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  update(id: string, data: { status?: OrderStatus }): Promise<Order>;
  findAll(params: { 
    page?: number; 
    limit?: number;
    status?: OrderStatus; 
  }): Promise<{ data: Order[]; meta: { total: number; page: number; limit: number } }>;
}

export const ORDER_REPOSITORY_PORT = 'ORDER_REPOSITORY_PORT'; 