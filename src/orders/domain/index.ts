export * from './model/order.entity';
export * from './model/order-item.entity';
export * from './model/order-status.enum';

export { 
  OrderRepository,
  CreateOrderItemData as RepositoryCreateOrderItemData,
  ORDER_REPOSITORY_PORT as REPO_ORDER_REPOSITORY_TOKEN,
  CreateOrderData as RepositoryCreateOrderData 
} from './repositories/order.repository';

export * from './model/order-receipt.entity';
export {
  OrderRepositoryPort,
  CreateOrderData,
  PaginatedOrderResult,
  MarkOrderAsPaidData,
  ORDER_REPOSITORY_PORT
} from './ports/order.repository.port';
export * from './ports/product.service.port';
export * from './ports/payment.service.port';