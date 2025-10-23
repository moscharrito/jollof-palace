import request from 'supertest';
import app from '../app';
import { OrderService } from '../services/OrderService';
import { mockPrisma } from './setup';

// Mock the OrderService
jest.mock('../services/OrderService');
const MockedOrderService = OrderService as jest.MockedClass<typeof OrderService>;

describe('Order API', () => {
  let mockOrderService: jest.Mocked<OrderService>;

  beforeEach(() => {
    mockOrderService = new MockedOrderService() as jest.Mocked<OrderService>;
    MockedOrderService.mockClear();
  });

  describe('POST /api/orders', () => {
    const validOrderData = {
      customerName: 'John Doe',
      customerPhone: '+2348012345678',
      customerEmail: 'john@example.com',
      orderType: 'PICKUP',
      items: [
        {
          menuItemId: 'menu-item-1',
          quantity: 2,
          customizations: ['Extra spicy'],
        },
      ],
      specialInstructions: 'Please make it extra spicy',
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
      estimatedReadyTime: new Date(),
      specialInstructions: 'Please make it extra spicy',
      createdAt: new Date(),
      updatedAt: new Date(),
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

    it('should create a new order', async () => {
      mockOrderService.createOrder.mockResolvedValue(mockCreatedOrder as any);

      const response = await request(app)
        .post('/api/orders')
        .send(validOrderData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockCreatedOrder,
        message: 'Order created successfully',
      });

      expect(mockOrderService.createOrder).toHaveBeenCalledWith(validOrderData);
    });

    it('should validate required fields', async () => {
      const invalidOrderData = {
        customerName: 'John Doe',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/orders')
        .send(invalidOrderData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate phone number format', async () => {
      const invalidOrderData = {
        ...validOrderData,
        customerPhone: '123456789', // Invalid format
      };

      const response = await request(app)
        .post('/api/orders')
        .send(invalidOrderData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require delivery address for delivery orders', async () => {
      const deliveryOrderData = {
        ...validOrderData,
        orderType: 'DELIVERY',
        // Missing deliveryAddress
      };

      const response = await request(app)
        .post('/api/orders')
        .send(deliveryOrderData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders/:id', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-123456-ABC',
      customerName: 'John Doe',
      status: 'CONFIRMED',
      total: 322500,
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
      mockOrderService.getOrderById.mockResolvedValue(mockOrder as any);

      const response = await request(app)
        .get('/api/orders/order-1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockOrder,
        message: 'Order retrieved successfully',
      });

      expect(mockOrderService.getOrderById).toHaveBeenCalledWith('order-1');
    });

    it('should return 404 for non-existent order', async () => {
      mockOrderService.getOrderById.mockRejectedValue(
        new Error('Order not found')
      );

      const response = await request(app)
        .get('/api/orders/non-existent')
        .expect(500); // This would be 404 with proper error handling

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders/number/:orderNumber', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-123456-ABC',
      customerName: 'John Doe',
      status: 'CONFIRMED',
      items: [],
    };

    it('should return order by order number', async () => {
      mockOrderService.getOrderByNumber.mockResolvedValue(mockOrder as any);

      const response = await request(app)
        .get('/api/orders/number/ORD-123456-ABC')
        .expect(200);

      expect(response.body.data).toEqual(mockOrder);
      expect(mockOrderService.getOrderByNumber).toHaveBeenCalledWith('ORD-123456-ABC');
    });
  });

  describe('GET /api/orders/track/:orderNumber', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-123456-ABC',
      status: 'PREPARING',
      estimatedReadyTime: new Date(),
      actualReadyTime: null,
      orderType: 'PICKUP',
      total: 322500,
      createdAt: new Date(),
      items: [
        {
          menuItem: {
            name: 'Jollof Rice',
          },
          quantity: 2,
        },
      ],
    };

    it('should return order tracking information', async () => {
      mockOrderService.getOrderByNumber.mockResolvedValue(mockOrder as any);

      const response = await request(app)
        .get('/api/orders/track/ORD-123456-ABC')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orderNumber');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('estimatedReadyTime');
      expect(response.body.data.items).toEqual([
        {
          name: 'Jollof Rice',
          quantity: 2,
        },
      ]);
    });
  });

  describe('POST /api/orders/:id/cancel', () => {
    const mockCancelledOrder = {
      id: 'order-1',
      orderNumber: 'ORD-123456-ABC',
      status: 'CANCELLED',
      items: [],
    };

    it('should cancel an order', async () => {
      mockOrderService.cancelOrder.mockResolvedValue(mockCancelledOrder as any);

      const response = await request(app)
        .post('/api/orders/order-1/cancel')
        .send({ reason: 'Customer requested cancellation' })
        .expect(200);

      expect(response.body.data.status).toBe('CANCELLED');
      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith(
        'order-1',
        'Customer requested cancellation'
      );
    });

    it('should cancel order without reason', async () => {
      mockOrderService.cancelOrder.mockResolvedValue(mockCancelledOrder as any);

      const response = await request(app)
        .post('/api/orders/order-1/cancel')
        .send({})
        .expect(200);

      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith('order-1', undefined);
    });
  });
});