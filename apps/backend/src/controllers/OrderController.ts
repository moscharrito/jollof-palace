import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { OrderService, CreateOrderData, OrderFilters } from '../services/OrderService';
import { asyncHandler } from '../middleware/errorHandler';
import { OrderStatus, OrderType } from '@prisma/client';
import { AuthenticatedRequest } from '../lib/auth';

export class OrderController extends BaseController {
  private orderService: OrderService;

  constructor() {
    super();
    this.orderService = new OrderService();
  }

  // POST /api/orders - Create new order (public)
  createOrder = asyncHandler(async (req: Request, res: Response) => {
    const orderData: CreateOrderData = req.body;

    const order = await this.orderService.createOrder(orderData);

    this.sendSuccess(res, order, 'Order created successfully', 201);
  });

  // GET /api/orders/:id - Get order by ID (public)
  getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await this.orderService.getOrderById(id);

    this.sendSuccess(res, order, 'Order retrieved successfully');
  });

  // GET /api/orders/number/:orderNumber - Get order by order number (public)
  getOrderByNumber = asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;

    const order = await this.orderService.getOrderByNumber(orderNumber);

    this.sendSuccess(res, order, 'Order retrieved successfully');
  });

  // GET /api/admin/orders - Get all orders with filters (admin only)
  getOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit } = this.getPagination(req);
    const { status, orderType, customerPhone, dateFrom, dateTo } = req.query;

    const filters: OrderFilters = {};

    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      filters.status = status as OrderStatus;
    }

    if (orderType && Object.values(OrderType).includes(orderType as OrderType)) {
      filters.orderType = orderType as OrderType;
    }

    if (customerPhone) {
      filters.customerPhone = customerPhone as string;
    }

    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom as string);
    }

    if (dateTo) {
      filters.dateTo = new Date(dateTo as string);
    }

    const { orders, total } = await this.orderService.getOrders(filters, page, limit);

    const pagination = {
      page,
      limit,
      total,
      totalPages: this.calculateTotalPages(total, limit),
    };

    this.sendPaginatedSuccess(res, orders, pagination, 'Orders retrieved successfully');
  });

  // PUT /api/admin/orders/:id/status - Update order status (admin only)
  updateOrderStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status, actualReadyTime } = req.body;

    const order = await this.orderService.updateOrderStatus(
      id,
      status,
      actualReadyTime ? new Date(actualReadyTime) : undefined
    );

    this.sendSuccess(res, order, 'Order status updated successfully');
  });

  // POST /api/orders/:id/cancel - Cancel order (public)
  cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await this.orderService.cancelOrder(id, reason);

    this.sendSuccess(res, order, 'Order cancelled successfully');
  });

  // PUT /api/admin/orders/:id/estimated-time - Update estimated ready time (admin only)
  updateEstimatedReadyTime = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { estimatedReadyTime } = req.body;

    if (!estimatedReadyTime) {
      this.sendError(res, 'Estimated ready time is required', 400);
      return;
    }

    const order = await this.orderService.updateEstimatedReadyTime(
      id,
      new Date(estimatedReadyTime)
    );

    this.sendSuccess(res, order, 'Estimated ready time updated successfully');
  });

  // GET /api/admin/orders/stats - Get order statistics (admin only)
  getOrderStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await this.orderService.getOrderStats();

    this.sendSuccess(res, stats, 'Order statistics retrieved successfully');
  });

  // GET /api/orders/track/:orderNumber - Track order by order number (public)
  trackOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;

    const order = await this.orderService.getOrderByNumber(orderNumber);

    // Return only tracking-relevant information
    const trackingInfo = {
      orderNumber: order.orderNumber,
      status: order.status,
      estimatedReadyTime: order.estimatedReadyTime,
      actualReadyTime: order.actualReadyTime,
      orderType: order.orderType,
      total: order.total,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
      })),
    };

    this.sendSuccess(res, trackingInfo, 'Order tracking information retrieved successfully');
  });

  // GET /api/admin/orders/queue - Get current order queue (admin only)
  getOrderQueue = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orders } = await this.orderService.getOrders(
      { status: 'CONFIRMED' },
      1,
      50 // Get up to 50 orders in queue
    );

    // Sort by estimated ready time
    const sortedOrders = orders.sort((a, b) => 
      new Date(a.estimatedReadyTime).getTime() - new Date(b.estimatedReadyTime).getTime()
    );

    const queueInfo = sortedOrders.map((order, index) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      orderType: order.orderType,
      estimatedReadyTime: order.estimatedReadyTime,
      itemCount: order.items.length,
      total: order.total,
      queuePosition: index + 1,
      items: order.items.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        preparationTime: item.menuItem.preparationTime,
      })),
    }));

    this.sendSuccess(res, queueInfo, 'Order queue retrieved successfully');
  });

  // GET /api/admin/orders/preparing - Get orders currently being prepared (admin only)
  getPreparingOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orders } = await this.orderService.getOrders(
      { status: 'PREPARING' },
      1,
      50
    );

    const preparingOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      orderType: order.orderType,
      estimatedReadyTime: order.estimatedReadyTime,
      total: order.total,
      items: order.items.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        preparationTime: item.menuItem.preparationTime,
      })),
    }));

    this.sendSuccess(res, preparingOrders, 'Preparing orders retrieved successfully');
  });

  // GET /api/admin/orders/ready - Get orders ready for pickup/delivery (admin only)
  getReadyOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orders } = await this.orderService.getOrders(
      { status: 'READY' },
      1,
      50
    );

    const readyOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      orderType: order.orderType,
      actualReadyTime: order.actualReadyTime,
      total: order.total,
      deliveryAddress: order.orderType === 'DELIVERY' ? {
        street: order.deliveryStreet,
        city: order.deliveryCity,
        state: order.deliveryState,
        landmark: order.deliveryLandmark,
      } : null,
    }));

    this.sendSuccess(res, readyOrders, 'Ready orders retrieved successfully');
  });
}