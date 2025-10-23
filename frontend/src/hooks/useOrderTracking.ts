import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Order, OrderStatus } from '../types';
import { toast } from 'react-hot-toast';

interface OrderUpdate {
  orderId: string;
  status: OrderStatus;
  estimatedReadyTime?: Date;
  actualReadyTime?: Date;
  order?: Order;
}

interface OrderReadyNotification {
  orderId: string;
  orderNumber: string;
  orderType: 'pickup' | 'delivery';
  estimatedReadyTime?: Date;
  actualReadyTime?: Date;
}

interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

export const useOrderTracking = (orderId: string | null) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connectSocket = useCallback(() => {
    if (!orderId || socketRef.current?.connected) {
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    
    socketRef.current = io(socketUrl, {
      auth: {
        orderId,
        userType: 'customer',
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to order tracking');
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
      
      // Request initial order status
      socket.emit('track-order', orderId);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from order tracking:', reason);
      setIsConnected(false);
      
      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }
      
      // Attempt to reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connectSocket();
        }, delay);
      } else {
        setError('Connection lost. Please refresh the page to reconnect.');
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setError('Failed to connect to real-time updates');
    });

    socket.on('order-status', (orderData: Order) => {
      console.log('Received order status:', orderData);
      setOrder(orderData);
      setIsLoading(false);
      setLastUpdate(new Date());
    });

    socket.on('order-status-updated', (update: OrderUpdate) => {
      console.log('Order status updated:', update);
      
      if (update.order) {
        setOrder(update.order);
      } else {
        // Update existing order with new status
        setOrder(prevOrder => {
          if (!prevOrder) return null;
          return {
            ...prevOrder,
            status: update.status,
            estimatedReadyTime: update.estimatedReadyTime ? 
              (typeof update.estimatedReadyTime === 'string' ? update.estimatedReadyTime : update.estimatedReadyTime.toISOString()) 
              : prevOrder.estimatedReadyTime,
            actualReadyTime: update.actualReadyTime ? 
              (typeof update.actualReadyTime === 'string' ? update.actualReadyTime : update.actualReadyTime.toISOString()) 
              : prevOrder.actualReadyTime,
          };
        });
      }
      
      setLastUpdate(new Date());
      
      // Show toast notification for status changes
      const statusMessages = {
        pending: 'Order received',
        confirmed: 'Order confirmed',
        preparing: 'Your order is being prepared',
        ready: 'Your order is ready!',
        completed: 'Order completed',
        cancelled: 'Order cancelled',
      };
      
      const message = statusMessages[update.status as keyof typeof statusMessages];
      if (message) {
        if (update.status === 'ready') {
          toast.success(message, { duration: 6000 });
        } else {
          toast(message, { icon: '📋' });
        }
      }
    });

    socket.on('order-ready', (notification: OrderReadyNotification) => {
      console.log('Order ready notification:', notification);
      
      // Show prominent notification
      toast.success(
        `Order #${notification.orderNumber} is ready for ${notification.orderType}!`,
        { 
          duration: 10000,
          style: {
            background: '#10B981',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
          }
        }
      );

      // Play notification sound if available
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(() => {
          // Ignore audio play errors (user interaction required)
        });
      } catch (error) {
        // Ignore audio errors
      }
    });

    socket.on('push-notification', (notification: PushNotification) => {
      console.log('Push notification:', notification);
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icons/logo-192.png',
          tag: notification.tag,
          requireInteraction: true,
        });
      }
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      setError(error.message);
      toast.error(error.message);
    });

  }, [orderId]);

  const disconnectSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  const refreshOrder = useCallback(() => {
    if (socketRef.current?.connected && orderId) {
      socketRef.current.emit('track-order', orderId);
    }
  }, [orderId]);

  // Connect when orderId is available
  useEffect(() => {
    if (orderId) {
      connectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [orderId, connectSocket, disconnectSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket]);

  return {
    order,
    isConnected,
    isLoading,
    error,
    lastUpdate,
    refreshOrder,
    requestNotificationPermission,
    reconnect: connectSocket,
  };
};