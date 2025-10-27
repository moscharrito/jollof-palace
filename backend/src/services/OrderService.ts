import { Order, OrderStatus, OrderType, Prisma } from '@prisma/client';
import { BaseService } from './BaseService';
import { NotFoundError, BusinessLogicError, ValidationError } from '../middleware/errorHandler';
import { getSocketManager } from '../lib/socket';

// Temporary inline utilities until shared package is properly configured
const BUSINESS_CONFIG = {
  TAX_RATE: 0.08, // 8% sales tax (US rate)
  DELIVERY_FEE: 500, // $5.00 delivery fee in cents
  MINIMUM_ORDER_AMOUNT: 1500, // $15.00 minimum order in cents
};

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

function calculateOrderTotal(subtotal: number, taxRate: number = 0.075, deliveryFee: number = 0): { tax: number; total: number } {
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax + deliveryFee;
  return { tax, total };
}

function calculateEstimatedReadyTime(preparationTimes: number[], queueLength: number = 0): Date {
  const maxPreparationTime = Math.max(...preparationTimes, 0);
  const bufferTime = 5; // 5 minutes buffer
  const queueDelay = queueLength * 3; // 3 minutes per order in queue
  
  const totalMinutes = maxPreparationTime + bufferTime + queueDelay;
  
  const readyTime = new Date();
  readyTime.setMinutes(readyTime.getMinutes() + totalMinutes);
  
  return readyTime;
}

export interface CreateOrderData {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: OrderType;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode?: string;
    landmark?: string;
  };
  items: Array<{
    menuItemId: string;
    quantity: number;
    customizations?: string[];
  }>;
  specialInstructions?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  orderType?: OrderType;
  customerPhone?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface OrderWithItems extends Order {
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    customizations: string[];
    menuItem: {
      id: string;
      name: string;
      description: string;
      imageUrl: string;
      preparationTime: number;
    };
  }>;
}

export class OrderService extends BaseService {


  constructor() {
    super();
  }
  async createOrder(data: CreateOrderData): Promise<OrderWithItems> {
    try {
      return await this.executeTransaction(async (tx) => {
        // Validate menu items and calculate totals
        const orderItems: any[] = [];
        let subtotal = 0;
        const preparationTimes: number[] = [];

        for (const item of data.items) {
          const menuItem = await tx.menuItem.findUnique({
            where: { id: item.menuItemId },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              isAvailable: true,
              preparationTime: true,
              imageUrl: true,
            },
          });

          if (!menuItem) {
            throw new ValidationError(`Menu item with ID ${item.menuItemId} not found`);
          }

          if (!menuItem.isAvailable) {
            throw new BusinessLogicError(`${menuItem.name} is currently unavailable`);
          }

          const itemSubtotal = menuItem.price * item.quantity;
          subtotal += itemSubtotal;
          preparationTimes.push(menuItem.preparationTime);

          orderItems.push({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: menuItem.price,
            subtotal: itemSubtotal,
            customizations: item.customizations || [],
            menuItem,
          });
        }

        // Check minimum order amount
        if (subtotal < BUSINESS_CONFIG.MINIMUM_ORDER_AMOUNT) {
          throw new BusinessLogicError(
            `Minimum order amount is $${(BUSINESS_CONFIG.MINIMUM_ORDER_AMOUNT / 100).toFixed(2)}`
          );
        }

        // Calculate delivery fee
        const deliveryFee = data.orderType === 'DELIVERY' ? BUSINESS_CONFIG.DELIVERY_FEE : 0;

        // Calculate totals
        const { tax, total } = calculateOrderTotal(subtotal, BUSINESS_CONFIG.TAX_RATE, deliveryFee);

        // Get current queue length for estimation
        const queueLength = await tx.order.count({
          where: {
            status: {
              in: ['CONFIRMED', 'PREPARING'],
            },
          },
        });

        // Calculate estimated ready time
        const estimatedReadyTime = calculateEstimatedReadyTime(preparationTimes, queueLength);

        // Create order
        const order = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail,
            orderType: data.orderType,
            deliveryStreet: data.deliveryAddress?.street,
            deliveryCity: data.deliveryAddress?.city,
            deliveryState: data.deliveryAddress?.state,
            deliveryPostalCode: data.deliveryAddress?.postalCode,
            deliveryLandmark: data.deliveryAddress?.landmark,
            subtotal,
            tax,
            deliveryFee,
            total,
            status: 'PENDING',
            estimatedReadyTime,
            specialInstructions: data.specialInstructions,
          },
        });

        // Create order items
        await tx.orderItem.createMany({
          data: orderItems.map((item) => ({
            orderId: order.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.subtotal,
            customizations: item.customizations,
          })),
        });

        // Return order with items
        return {
          ...order,
          items: orderItems.map((item) => ({
            id: '', // Will be set by database
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.subtotal,
            customizations: item.customizations,
            menuItem: {
              id: item.menuItem.id,
              name: item.menuItem.name,
              description: item.menuItem.description,
              imageUrl: item.menuItem.imageUrl,
              preparationTime: item.menuItem.preparationTime,
            },
          })),
        };
      });
    } catch (error) {
      this.handleError(error, 'OrderService.createOrder');
    }
  }

  async getOrderById(id: string): Promise<OrderWithItems> {
    try {
      const order = await this.db.order.findUnique({
        where: { id },
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

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      return order as OrderWithItems;
    } catch (error) {
      this.handleError(error, 'OrderService.getOrderById');
    }
  }

  async getOrderByNumber(orderNumber: string): Promise<OrderWithItems> {
    try {
      const order = await this.db.order.findUnique({
        where: { orderNumber },
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

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      return order as OrderWithItems;
    } catch (error) {
      this.handleError(error, 'OrderService.getOrderByNumber');
    }
  }

  async getOrders(
    filters: OrderFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ orders: OrderWithItems[]; total: number }> {
    try {
      const where: Prisma.OrderWhereInput = {};

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.orderType) {
        where.orderType = filters.orderType;
      }

      if (filters.customerPhone) {
        where.customerPhone = {
          contains: filters.customerPhone,
          mode: 'insensitive',
        };
      }

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.createdAt.lte = filters.dateTo;
        }
      }

      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        this.db.order.findMany({
          where,
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
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.db.order.count({ where }),
      ]);

      return { orders: orders as OrderWithItems[], total };
    } catch (error) {
      this.handleError(error, 'OrderService.getOrders');
    }
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    actualReadyTime?: Date
  ): Promise<OrderWithItems> {
    try {
      const order = await this.getOrderById(id);

      // Validate status transition
      if (!this.canUpdateStatus(order.status, status)) {
        throw new BusinessLogicError(
          `Cannot update order status from ${order.status} to ${status}`
        );
      }

      const updateData: Prisma.OrderUpdateInput = { status };

      // Set actual ready time when order is marked as ready
      if (status === 'READY' && !actualReadyTime) {
        updateData.actualReadyTime = new Date();
      } else if (actualReadyTime) {
        updateData.actualReadyTime = actualReadyTime;
      }

      const updatedOrder = await this.db.order.update({
        where: { id },
        data: updateData,
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

      // Broadcast real-time update
      const socketManager = getSocketManager();
      if (socketManager) {
        await socketManager.broadcastOrderUpdate(updatedOrder);
        
        // Send special notification when order is ready
        if (status === 'READY') {
          await socketManager.notifyOrderReady(id);
        }
      }

      // SMS notifications disabled
      console.log(`Order ${id} status updated to ${status} - SMS notifications disabled`);

      return updatedOrder as OrderWithItems;
    } catch (error) {
      this.handleError(error, 'OrderService.updateOrderStatus');
    }
  }

  async cancelOrder(id: string, reason?: string): Promise<OrderWithItems> {
    try {
      const order = await this.getOrderById(id);

      if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        throw new BusinessLogicError('Order cannot be cancelled at this stage');
      }

      const updatedOrder = await this.db.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          specialInstructions: reason
            ? `${order.specialInstructions || ''}\nCancellation reason: ${reason}`.trim()
            : order.specialInstructions,
        },
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

      return updatedOrder as OrderWithItems;
    } catch (error) {
      this.handleError(error, 'OrderService.cancelOrder');
    }
  }

  async getOrderStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    statusDistribution: Record<OrderStatus, number>;
  }> {
    try {
      const [
        totalOrders,
        pendingOrders,
        completedOrders,
        revenueResult,
        statusDistribution,
      ] = await Promise.all([
        this.db.order.count(),
        this.db.order.count({ where: { status: 'PENDING' } }),
        this.db.order.count({ where: { status: 'COMPLETED' } }),
        this.db.order.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { total: true },
        }),
        this.db.order.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
      ]);

      const totalRevenue = revenueResult._sum.total || 0;
      const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

      const statusStats = statusDistribution.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<OrderStatus, number>);

      return {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
        averageOrderValue,
        statusDistribution: statusStats,
      };
    } catch (error) {
      this.handleError(error, 'OrderService.getOrderStats');
    }
  }

  async updateEstimatedReadyTime(id: string, newEstimatedTime: Date): Promise<OrderWithItems> {
    try {
      const order = await this.getOrderById(id);

      if (!['CONFIRMED', 'PREPARING'].includes(order.status)) {
        throw new BusinessLogicError('Can only update estimated time for confirmed or preparing orders');
      }

      const updatedOrder = await this.db.order.update({
        where: { id },
        data: { estimatedReadyTime: newEstimatedTime },
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

      return updatedOrder as OrderWithItems;
    } catch (error) {
      this.handleError(error, 'OrderService.updateEstimatedReadyTime');
    }
  }

  private canUpdateStatus(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'CANCELLED'],
      READY: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}