import { OrderService } from '../services/OrderService';
import { mockPrisma } from './setup';
import { NotFoundError, BusinessLogicError, ValidationError } from '../middleware/errorHandler';

// Mock the database
jest.mock('../lib/database', () => ({
  prisma: mockPrisma,
}));

// Mock local utilities
jest.mock('@/utils', () => ({
  generateOrderNumber: jest.fn(() => 'ORD-123456-ABC'),
  calculateOrderTotal: jest.fn(() => ({ tax: 22500, total: 322500 })),
  calculateEstimatedReadyTime: jest.fn(() => new Date('2024-01-01T12:30:00Z')),
}));

describe('OrderService', () => {
  let orderService: OrderService;

  beforeEach(() => {
    orderService = new OrderService();
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const validOrderData = {
      customerName: 'John Doe',
      customerPhone: '+2348012345678',
      customerEmail: 'john@example.com',
      orderType: 'PICKUP' as const,
      items: [
        {
          menuItemId: 'menu-item-1',
          quantity: 2,
          customizations: ['Extra spicy'],
        },
      ],
      specialInstructions: 'Please make it extra spicy',
    };

    const mockMenuItem = {
      id: 'menu-item-1',
      name: 'Jollof Rice',
      description: 'Authentic Nigerian jollof rice',
      price: 150000,
      isAvailable: true,
      preparationTime: 15,
      imageUrl: 'https://example.com/jollof.jpg',
    };

    const mockCreatedOrder = {
      id: 'order-1',
      orderNumber: 'ORD-123456-ABC',
      customerName: 'John Doe',
      customerPhone: '+2348012345678',
      customerEmail: 'john@example.com',
      orderType: 'PICKUP',
      subtotal: 300000,
      tax: 22500,
      deliveryFee: 0,
      total: 322500,
      status: 'PENDING',
      estimatedReadyTime: new Date('2024-01-01T12:30:00Z'),
      specialInstructions: 'Please make it extra spicy',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a new order successfully', async () => {
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
      expect(result.total).toBe(322500);
      expect(result.items).toHaveLength(1);
    });

    it('should throw ValidationError for non-existent menu item', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          menuItem: {
            findUnique: jest.fn().mockResolvedValue(null), // Item not found
          },
        };
        return callback(tx as any);
      });

      await expect(orderService.createOrder(validOrderData)).rejects.toThrow(ValidationError);
    });

    it('should throw BusinessLogicError for unavailable menu item', async () => {
      const unavailableItem = { ...mockMenuItem, isAvailable: false };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          menuItem: {
            findUnique: jest.fn().mockResolvedValue(unavailableItem),
          },
        };
        return callback(tx as any);
      });

      await expect(orderService.createOrder(validOrderData)).rejects.toThrow(BusinessLogicError);
    });

    it('should throw BusinessLogicError for order below minimum amount', async () => {
      const cheapItem = { ...mockMenuItem, price: 50000 }; // ₦500

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          menuItem: {
            findUnique: jest.fn().mockResolvedValue(cheapItem),
          },
        };
        return callback(tx as any);
      });

      await expect(orderService.createOrder(validOrderData)).rejects.toThrow(BusinessLogicError);
    });

    it('should add delivery fee for delivery orders', async () => {
      const deliveryOrderData = {
        ...validOrderData,
        orderType: 'DELIVERY' as const,
        deliveryAddress: {
          street: '123 Main Street',
          city: 'Lagos',
          state: 'Lagos State',
        },
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          menuItem: {
            findUnique: jest.fn().mockResolvedValue(mockMenuItem),
          },
          order: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({
              ...mockCreatedOrder,
              orderType: 'DELIVERY',
              deliveryFee: 50000, // ₦500 delivery fee
            }),
          },
          orderItem: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(tx as any);
      });

      const result = await orderService.createOrder(deliveryOrderData);

      expect(result.orderType).toBe('DELIVERY');
    });
  });

  describe('getOrderById', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-123456-ABC',
      customerName: 'John Doe',
      status: 'CONFIRMED',
      items: [
        {
          id: 'item-1',
          quantity: 2,
          unitPrice: 150000,
          subtotal: 300000,
          customizations: ['Extra spicy'],
          menuItem: {
            id: 'menu-item-1',
            name: 'Jollof Rice',
            description: 'Authentic Nigerian jollof rice',
            imageUrl: 'https://example.com/jollof.jpg',
            preparationTime: 15,
          },
        },
      ],
    };

    it('should return order by ID', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('order-1');

      expect(result).toEqual(mockOrder);
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          items: {
            include: {
              menuItem: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  imageUrl: true,
                  preparationTime: true,
                },
              },
            },
          },
        },
      });
    });

    it('should throw NotFoundError for non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(orderService.getOrderById('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateOrderStatus', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-123456-ABC',
      status: 'CONFIRMED',
      items: [],
    };

    it('should update order status successfully', async () => {
      const updatedOrder = { ...mockOrder, status: 'PREPARING' };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue(updatedOrder);

      const result = await orderService.updateOrderStatus('order-1', 'PREPARING');

      expect(result.status).toBe('PREPARING');
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'PREPARING' },
        include: expect.any(Object),
      });
    });

    it('should throw BusinessLogicError for invalid status transition', async () => {
      const completedOrder = { ...mockOrder, status: 'COMPLETED' };
      mockPrisma.order.findUnique.mockResolvedValue(completedOrder);

      await expect(
        orderService.updateOrderStatus('order-1', 'PREPARING')
      ).rejects.toThrow(BusinessLogicError);
    });

    it('should set actualReadyTime when marking as ready', async () => {
      const preparingOrder = { ...mockOrder, status: 'PREPARING' };
      const readyOrder = { ...mockOrder, status: 'READY', actualReadyTime: new Date() };

      mockPrisma.order.findUnique.mockResolvedValue(preparingOrder);
      mockPrisma.order.update.mockResolvedValue(readyOrder);

      const result = await orderService.updateOrderStatus('order-1', 'READY');

      expect(result.status).toBe('READY');
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'READY', actualReadyTime: expect.any(Date) },
        include: expect.any(Object),
      });
    });
  });

  describe('cancelOrder', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-123456-ABC',
      status: 'CONFIRMED',
      specialInstructions: 'Original instructions',
      items: [],
    };

    it('should cancel order successfully', async () => {
      const cancelledOrder = { ...mockOrder, status: 'CANCELLED' };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue(cancelledOrder);

      const result = await orderService.cancelOrder('order-1', 'Customer request');

      expect(result.status).toBe('CANCELLED');
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          status: 'CANCELLED',
          specialInstructions: 'Original instructions\nCancellation reason: Customer request',
        },
        include: expect.any(Object),
      });
    });

    it('should throw BusinessLogicError for orders that cannot be cancelled', async () => {
      const preparingOrder = { ...mockOrder, status: 'PREPARING' };
      mockPrisma.order.findUnique.mockResolvedValue(preparingOrder);

      await expect(
        orderService.cancelOrder('order-1', 'Too late')
      ).rejects.toThrow(BusinessLogicError);
    });
  });

  describe('getOrderStats', () => {
    it('should return order statistics', async () => {
      const mockStats = {
        totalOrders: 100,
        pendingOrders: 5,
        completedOrders: 80,
        totalRevenue: 5000000, // ₦50,000
        averageOrderValue: 62500, // ₦625
      };

      mockPrisma.order.count
        .mockResolvedValueOnce(100) // total orders
        .mockResolvedValueOnce(5)   // pending orders
        .mockResolvedValueOnce(80); // completed orders

      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { total: 5000000 },
      });

      mockPrisma.order.groupBy.mockResolvedValue([
        { status: 'PENDING', _count: { id: 5 } },
        { status: 'CONFIRMED', _count: { id: 10 } },
        { status: 'COMPLETED', _count: { id: 80 } },
        { status: 'CANCELLED', _count: { id: 5 } },
      ]);

      const result = await orderService.getOrderStats();

      expect(result.totalOrders).toBe(100);
      expect(result.pendingOrders).toBe(5);
      expect(result.completedOrders).toBe(80);
      expect(result.totalRevenue).toBe(5000000);
      expect(result.averageOrderValue).toBe(62500);
      expect(result.statusDistribution).toEqual({
        PENDING: 5,
        CONFIRMED: 10,
        COMPLETED: 80,
        CANCELLED: 5,
      });
    });
  });
});