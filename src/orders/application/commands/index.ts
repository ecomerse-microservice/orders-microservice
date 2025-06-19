import { CreateOrderHandler } from './handlers/create-order.handler';
import { ChangeOrderStatusHandler } from './handlers/change-order-status.handler';
import { MarkOrderAsPaidHandler } from './handlers/mark-order-as-paid.handler';

export * from './impl/create-order.command';
export * from './impl/change-order-status.command';
export * from './impl/mark-order-as-paid.command';

export const CommandHandlers = [
  CreateOrderHandler,
  ChangeOrderStatusHandler,
  MarkOrderAsPaidHandler,
];