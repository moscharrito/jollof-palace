// Mock the database first
const mockPrisma = {
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  orderItem: {
    createMany: jest.fn(),
  },
  menuItem: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('../lib/database', () => ({
  prisma: mockPrisma,
}));

import { OrderService, CreateOrderData } from '../services/OrderService';
import { OrderStatus, OrderType } from '@prisma/client';
import { NotFoundError, BusinessLogicError, ValidationError } from '../middleware/errorHandler';

describe('Order Processing System', () => {
  let orderService: OrderService;

  beforeEach(() => {
    orderService = new OrderService();
    jest.clearAllMocks();
  });

  describe('Order Creation', () => {
    const validOrderData: CreateOrderData = {
      customerName: 'Adebayo Johnson',
      customerPhone: '+2348012345678',
      customerEmail: 'adebayo@example.com',
      orderType: 'PICKUP' as OrderType,
      items: [
        {
          menuItemId: 'jollof-rice-1',
          quantity: 2,
          customizations: ['Extra spicy'],
        },
      ],
      specialInstructions: 'Please make it extra spicy',
    };

    const mockMenuItem = {
      id: 'jollof-rice-1',
      name: 'Jollof Rice with Pepper Chicken',
      description: 'Authentic Nigerian jollof rice with spicy pepper chicken',
      price: 150000, // ₦1500 in kobo
      isAvailable: true,
      preparationTime: 20,
      imageUrl: 'https://example.com/jollof-chicken.jpg',
    };

    const mockCreatedOrder = {
      id: 'order-1',
      orderNumber: 'ORD-123456-ABC',
      customerName: 'Adebayo Johnson',
      customerPhone: '+2348012345678',
      customerEmail: 'adebayo@example.com',
      orderType: 'PICKUP',
      subtotal: 300000, // ₦3000 in kobo
      tax: 22500, // 7.5% VAT
      deliveryFee: 0,
      total: 322500,
      status: 'PENDING',
      estimatedReadyTime: new Date('2024-01-01T12:30:00Z'),
      specialInstructions: 'Please make it extra spicy',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create order with valid data', async () => {
      // Mock transaction
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          menuItem: {
            findUnique: jest.fn().mockResolvedValue(mockMenuItem),
          },
          order: {
            count: jest.fn().mockResolvedValue(2), // Queue length
            create: jest.fn().mockResolvedValue(mockCreatedOrder),
          },
          orderItem: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(tx as any);
      });

      const result = await orderService.createOrder(validOrderData);

      expect(result.orderNumber).toBe('ORD-123456-ABC');
      expect(result.customerName).toBe('Adebayo Johnson');
      expect(result.status).toBe('PENDING');
    });

    it('should validate menu item availability', async () => {
      const unavailableItem = { ...mockMenuItem, isAvailable: false };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          menuItem: {
            findUnique: jest.fn().mockResolvedValue(unavailableItem),
          },
        };
        return callback(tx as any);
      });

      await expect(orderService.createOrder(validOrderData)).rejects.toThrow(
        BusinessLogicError
      );
    });
  });

  describe('Order Status Management', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-123456-ABC',
      status: 'CONFIRMED' as OrderStatus,
      items: [],
    };

    it('should update order status with valid transitions', async () => {
      const updatedOrder = { ...mockOrder, status: 'PREPARING' as OrderStatus };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue(updatedOrder);

      const result = await orderService.updateOrderStatus('order-1', 'PREPARING');

      expect(result.status).toBe('PREPARING');
    });

    it('should reject invalid status transitions', async () => {
      const completedOrder = { ...mockOrder, status: 'COMPLETED' as OrderStatus };
      mockPrisma.order.findUnique.mockResolvedValue(completedOrder);

      await expect(
        orderService.updateOrderStatus('order-1', 'PREPARING')
      ).rejects.toThrow(BusinessLogicError);
    });
  });

  describe('Order Retrieval', () => {
    const mockOrderWithItems = {
      id: 'order-1',
      orderNumber: 'ORD-123456-ABC',
      customerName: 'Adebayo Johnson',
      status: 'CONFIRMED',
      total: 322500,
      items: [
        {
          id: 'item-1',
          quantity: 2,
          unitPrice: 150000,
          totalPrice: 300000,
          customizations: ['Extra spicy'],
          menuItem: {
            id: 'jollof-rice-1',
            name: 'Jollof Rice with Pepper Chicken',
            description: 'Authentic Nigerian jollof rice with spicy pepper chicken',
            imageUrl: 'https://example.com/jollof-chicken.jpg',
            preparationTime: 20,
          },
        },
      ],
    };

    it('should retrieve order by ID', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrderWithItems);

      const result = await orderService.getOrderById('order-1');

      expect(result).toEqual(mockOrderWithItems);
    });

    it('should throw NotFoundError for non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(orderService.getOrderById('non-existent')).rejects.toThrow(
        NotFoundError
      );
    });
  });
});