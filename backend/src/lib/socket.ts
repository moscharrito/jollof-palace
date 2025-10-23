import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SocketUser {
  id: string;
  type: 'customer' | 'admin';
  orderId?: string; // For customers tracking specific orders
  adminId?: string; // For admin users
}

export class SocketManager {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, SocketUser>();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const orderId = socket.handshake.auth.orderId;
        const userType = socket.handshake.auth.userType || 'customer';

        if (userType === 'admin' && token) {
          // Verify admin JWT token
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
          const admin = await prisma.adminUser.findUnique({
            where: { id: decoded.id, isActive: true },
          });

          if (!admin) {
            return next(new Error('Invalid admin token'));
          }

          socket.data.user = {
            id: socket.id,
            type: 'admin',
            adminId: admin.id,
          } as SocketUser;
        } else if (userType === 'customer' && orderId) {
          // For customers, verify they have access to the order
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, customerName: true, customerPhone: true },
          });

          if (!order) {
            return next(new Error('Order not found'));
          }

          socket.data.user = {
            id: socket.id,
            type: 'customer',
            orderId: orderId,
          } as SocketUser;
        } else {
          return next(new Error('Invalid authentication'));
        }

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = socket.data.user as SocketUser;
      this.connectedUsers.set(socket.id, user);

      console.log(`User connected: ${user.type} - ${socket.id}`);

      // Join appropriate rooms
      if (user.type === 'customer' && user.orderId) {
        socket.join(`order:${user.orderId}`);
        socket.join('customers');
      } else if (user.type === 'admin') {
        socket.join('admins');
        socket.join('order-updates'); // Admins get all order updates
      }

      // Handle customer events
      socket.on('track-order', async (orderId: string) => {
        if (user.type === 'customer' && user.orderId === orderId) {
          try {
            const order = await this.getOrderWithDetails(orderId);
            socket.emit('order-status', order);
          } catch (error) {
            socket.emit('error', { message: 'Failed to fetch order details' });
          }
        }
      });

      // Handle admin events
      socket.on('update-order-status', async (data: { orderId: string; status: string; estimatedTime?: Date }) => {
        if (user.type === 'admin') {
          try {
            await this.updateOrderStatus(data.orderId, data.status, data.estimatedTime);
          } catch (error) {
            socket.emit('error', { message: 'Failed to update order status' });
          }
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${user.type} - ${socket.id}`);
        this.connectedUsers.delete(socket.id);
      });

      // Send initial order status for customers
      if (user.type === 'customer' && user.orderId) {
        this.sendOrderStatus(user.orderId);
      }
    });
  }

  private async getOrderWithDetails(orderId: string) {
    return await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                preparationTime: true,
              },
            },
          },
        },
      },
    });
  }

  private async updateOrderStatus(orderId: string, status: string, estimatedTime?: Date) {
    const updateData: any = { status };
    
    if (estimatedTime) {
      updateData.estimatedReadyTime = estimatedTime;
    }

    if (status === 'READY') {
      updateData.actualReadyTime = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                preparationTime: true,
              },
            },
          },
        },
      },
    });

    // Broadcast to all relevant parties
    this.broadcastOrderUpdate(updatedOrder);

    return updatedOrder;
  }

  // Public methods for external use
  public async broadcastOrderUpdate(order: any) {
    // Send to customer tracking this order
    this.io.to(`order:${order.id}`).emit('order-status-updated', {
      orderId: order.id,
      status: order.status,
      estimatedReadyTime: order.estimatedReadyTime,
      actualReadyTime: order.actualReadyTime,
      order: order,
    });

    // Send to all admins
    this.io.to('admins').emit('order-updated', {
      orderId: order.id,
      status: order.status,
      customerName: order.customerInfo.name,
      orderNumber: order.orderNumber,
      total: order.total,
    });

    console.log(`Broadcasted order update for ${order.orderNumber}: ${order.status}`);
  }

  public async sendOrderStatus(orderId: string) {
    try {
      const order = await this.getOrderWithDetails(orderId);
      if (order) {
        this.io.to(`order:${orderId}`).emit('order-status', order);
      }
    } catch (error) {
      console.error('Error sending order status:', error);
    }
  }

  public async notifyOrderReady(orderId: string) {
    try {
      const order = await this.getOrderWithDetails(orderId);
      if (order) {
        this.io.to(`order:${orderId}`).emit('order-ready', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderType: order.orderType,
          estimatedReadyTime: order.estimatedReadyTime,
          actualReadyTime: order.actualReadyTime,
        });

        // Also send push notification if supported
        this.io.to(`order:${orderId}`).emit('push-notification', {
          title: 'Order Ready!',
          body: `Your order #${order.orderNumber} is ready for ${order.orderType.toLowerCase()}`,
          icon: '/icons/order-ready.png',
          tag: `order-${orderId}`,
        });
      }
    } catch (error) {
      console.error('Error notifying order ready:', error);
    }
  }

  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public getConnectedCustomers(): SocketUser[] {
    return Array.from(this.connectedUsers.values()).filter(user => user.type === 'customer');
  }

  public getConnectedAdmins(): SocketUser[] {
    return Array.from(this.connectedUsers.values()).filter(user => user.type === 'admin');
  }
}

let socketManager: SocketManager | null = null;

export const initializeSocket = (server: HTTPServer): SocketManager => {
  if (!socketManager) {
    socketManager = new SocketManager(server);
  }
  return socketManager;
};

export const getSocketManager = (): SocketManager | null => {
  return socketManager;
};