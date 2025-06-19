import { Test } from '@nestjs/testing';
import { CreateOrderHandler } from '../src/orders/application/commands/handlers/create-order.handler';
import { 
  ORDER_REPOSITORY_PORT,
  PRODUCT_SERVICE_PORT,
  PAYMENT_SERVICE_PORT
} from '../src/orders/domain';
import { CreateOrderCommand } from '../src/orders/application/commands/impl/create-order.command';

describe('CreateOrderHandler', () => {
  let handler: CreateOrderHandler;
  let orderRepository: any;
  let productService: any;
  let paymentService: any;

  beforeEach(async () => {
    // ID fijo para pruebas
    const testProductId = "test-product-id";
    
    // Mock order con el valor esperado
    const mockOrder = {
      id: 'test-order-id',
      userId: 'test-user-id',
      status: 'PENDING',
      totalAmount: 21.98,
      totalItems: 2,
      items: [
        {
          id: 'test-item-id',
          productId: testProductId,
          quantity: 2,
          price: 10.99
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Mock de servicios
    const mockOrderRepository = {
      create: jest.fn().mockResolvedValue(mockOrder),
      findById: jest.fn(),
      findAll: jest.fn(),
    };

    const mockProductService = {
      validateProductsByIds: jest.fn().mockResolvedValue([
        {
          id: testProductId,
          name: 'Test Product',
          price: 10.99,
          available: true
        }
      ]),
    };

    const mockPaymentService = {
      createPaymentSession: jest.fn().mockResolvedValue({
        id: 'test-payment-session-id',
        url: 'https://payment.example.com/session/123',
        status: 'PENDING'
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateOrderHandler,
        {
          provide: ORDER_REPOSITORY_PORT,
          useValue: mockOrderRepository,
        },
        {
          provide: PRODUCT_SERVICE_PORT,
          useValue: mockProductService,
        },
        {
          provide: PAYMENT_SERVICE_PORT,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    handler = moduleRef.get<CreateOrderHandler>(CreateOrderHandler);
    orderRepository = moduleRef.get(ORDER_REPOSITORY_PORT);
    productService = moduleRef.get(PRODUCT_SERVICE_PORT);
    paymentService = moduleRef.get(PAYMENT_SERVICE_PORT);
  });

  it('debería crear una orden correctamente', async () => {
    // Arrange
    const productId = "test-product-id";
    const userId = "test-user-id";
    const command = new CreateOrderCommand({
      userId: userId,
      items: [
        {
          productId,
          quantity: 2
        }
      ]
    });

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toBeDefined();
    expect(result.order).toBeDefined();
    expect(result.paymentSession).toBeDefined();
    expect(orderRepository.create).toHaveBeenCalledTimes(1);
    expect(orderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: userId,
        items: expect.arrayContaining([
          expect.objectContaining({
            productId,
            quantity: 2
          })
        ])
      })
    );
    expect(productService.validateProductsByIds).toHaveBeenCalledWith([productId]);
    expect(paymentService.createPaymentSession).toHaveBeenCalledTimes(1);
  });
}); 