import { FindAllOrdersHandler } from './handlers/find-all-orders.handler';
import { FindOneOrderHandler } from './handlers/find-one-order.handler';
// ValidateProducts logic is now part of ProductServicePort and used by CreateOrderHandler etc.

export * from './impl/find-all-orders.query';
export * from './impl/find-one-order.query';
// export * from './impl/validate-products.query'; // No longer needed as a direct query here

export const QueryHandlers = [
  FindAllOrdersHandler,
  FindOneOrderHandler,
  // ValidateProductsHandler removed - validation is internal or via ProductServicePort
];