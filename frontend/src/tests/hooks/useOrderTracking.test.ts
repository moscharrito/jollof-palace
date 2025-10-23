import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { toast } from 'react-hot-toast';
import { useOrderTracking } from '../../hooks/useOrderTracking';

// Mock dependencies
vi.mock('react-hot-toast');
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  })),
}));

const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
};

const mockIo = vi.fn(() => mockSocket);

describe('useOrderTracking', () => {
  const mockToast = toast as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();
    
    // Mock socket.io
    vi.doMock('socket.io-client', () => ({
      io: mockIo,
    }));
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useOrderTracking('order-123'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.order).toBe(null);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should connect to socket when orderId is provided', () => {
    renderHook(() => useOrderTracking('order-123'));

    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: {
          orderId: 'order-123',
          userType: 'customer',
        },
      })
    );
  });

  it('should not connect when orderId is null', () => {
    renderHook(() => useOrderTracking(null));

    expect(mockIo).not.toHaveBeenCalled();
  });

  it('should handle socket connection', async () => {
    const { result } = renderHook(() => useOrderTracking('order-123'));

    // Simulate socket connection
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
      if (connectHandler) connectHandler();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.error).toBe(null);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('track-order', 'order-123');
  });

  it('should handle socket disconnection', async () => {
    const { result } = renderHook(() => useOrderTracking('order-123'));

    // Connect first
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
      if (connectHandler) connectHandler();
    });

    // Then disconnect
    act(() => {
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1];
      if (disconnectHandler) disconnectHandler('transport close');
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('should handle order status updates', async () => {
    const { result } = renderHook(() => useOrderTracking('order-123'));

    const mockOrder = {
      id: 'order-123',
      orderNumber: 'ORD-001',
      status: 'confirmed',
      customerInfo: { name: 'John Doe', phone: '1234567890' },
      items: [],
      subtotal: 1000,
      tax: 75,
      total: 1075,
      orderType: 'pickup',
      estimatedReadyTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      const statusHandler = mockSocket.on.mock.calls.find(call => call[0] === 'order-status')?.[1];
      if (statusHandler) statusHandler(mockOrder);
    });

    await waitFor(() => {
      expect(result.current.order).toEqual(mockOrder);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle order status updates with notifications', async () => {
    const { result } = renderHook(() => useOrderTracking('order-123'));

    const statusUpdate = {
      orderId: 'order-123',
      status: 'ready',
      order: {
        id: 'order-123',
        status: 'ready',
        orderNumber: 'ORD-001',
      },
    };

    act(() => {
      const updateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'order-status-updated')?.[1];
      if (updateHandler) updateHandler(statusUpdate);
    });

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Your order is ready!', { duration: 6000 });
    });
  });

  it('should handle order ready notifications', async () => {
    renderHook(() => useOrderTracking('order-123'));

    const readyNotification = {
      orderId: 'order-123',
      orderNumber: 'ORD-001',
      orderType: 'pickup',
    };

    act(() => {
      const readyHandler = mockSocket.on.mock.calls.find(call => call[0] === 'order-ready')?.[1];
      if (readyHandler) readyHandler(readyNotification);
    });

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        'Order #ORD-001 is ready for pickup!',
        expect.objectContaining({
          duration: 10000,
        })
      );
    });
  });

  it('should handle push notifications', async () => {
    // Mock Notification API
    const mockNotification = vi.fn();
    Object.defineProperty(window, 'Notification', {
      value: mockNotification,
      writable: true,
    });
    Object.defineProperty(Notification, 'permission', {
      value: 'granted',
      writable: true,
    });

    renderHook(() => useOrderTracking('order-123'));

    const pushNotification = {
      title: 'Order Ready!',
      body: 'Your order is ready for pickup',
      icon: '/icons/logo-192.png',
      tag: 'order-123',
    };

    act(() => {
      const pushHandler = mockSocket.on.mock.calls.find(call => call[0] === 'push-notification')?.[1];
      if (pushHandler) pushHandler(pushNotification);
    });

    await waitFor(() => {
      expect(mockNotification).toHaveBeenCalledWith(
        'Order Ready!',
        expect.objectContaining({
          body: 'Your order is ready for pickup',
          icon: '/icons/logo-192.png',
          tag: 'order-123',
        })
      );
    });
  });

  it('should handle socket errors', async () => {
    const { result } = renderHook(() => useOrderTracking('order-123'));

    const error = { message: 'Connection failed' };

    act(() => {
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'error')?.[1];
      if (errorHandler) errorHandler(error);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Connection failed');
      expect(mockToast.error).toHaveBeenCalledWith('Connection failed');
    });
  });

  it('should refresh order when requested', async () => {
    const { result } = renderHook(() => useOrderTracking('order-123'));

    // Connect first
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
      if (connectHandler) connectHandler();
    });

    // Clear previous emit calls
    mockSocket.emit.mockClear();

    act(() => {
      result.current.refreshOrder();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('track-order', 'order-123');
  });

  it('should request notification permission', async () => {
    // Mock Notification API
    const mockRequestPermission = vi.fn(() => Promise.resolve('granted'));
    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'default',
        requestPermission: mockRequestPermission,
      },
      writable: true,
    });

    const { result } = renderHook(() => useOrderTracking('order-123'));

    let permissionGranted;
    await act(async () => {
      permissionGranted = await result.current.requestNotificationPermission();
    });

    expect(mockRequestPermission).toHaveBeenCalled();
    expect(permissionGranted).toBe(true);
  });

  it('should disconnect socket on unmount', () => {
    const { unmount } = renderHook(() => useOrderTracking('order-123'));

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should handle reconnection attempts', async () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useOrderTracking('order-123'));

    // Simulate disconnect that should trigger reconnection
    act(() => {
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1];
      if (disconnectHandler) disconnectHandler('transport close');
    });

    // Clear previous calls
    mockIo.mockClear();

    // Fast-forward timers to trigger reconnection
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockIo).toHaveBeenCalledTimes(1);
    });

    vi.useRealTimers();
  });
});