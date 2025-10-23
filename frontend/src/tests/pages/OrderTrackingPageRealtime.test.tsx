import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

import OrderTrackingPage from '../../pages/OrderTrackingPage';
import { Order } from '@food-ordering/shared';

// Mock dependencies
vi.mock('react-hot-toast');
vi.mock('../../hooks/useOrderTracking');

const mockOrder: Order = {
  id: 'order-123',
  orderNumber: 'ORD-12345',
  customerInfo: {
    name: 'John Doe',
    phone: '1234567890',
    email: 'john@example.com',
    deliveryAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
    },
  },
  items: [
    {
      id: 'item-1',
      menuItemId: 'jollof-chicken',
      menuItem: {
        id: 'jollof-chicken',
        name: 'Jollof Rice with Pepper Chicken',
        description: 'Delicious jollof rice',
        price: 1500,
        category: 'main',
        imageUrl: '/images/jollof.jpg',
        isAvailable: true,
        preparationTime: 25,
        ingredients: ['rice', 'chicken'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      quantity: 2,
      unitPrice: 1500,
      subtotal: 3000,
      customizations: ['Extra spicy'],
    },
  ],
  subtotal: 3000,
  tax: 263,
  total: 3763,
  status: 'preparing',
  orderType: 'delivery',
  estimatedReadyTime: new Date(Date.now() + 30 * 60 * 1000),
  createdAt: new Date(Date.now() - 10 * 60 * 1000),
  updatedAt: new Date(),
  paymentStatus: 'completed',
  paymentMethod: 'card',
};

const mockUseOrderTracking = {
  order: mockOrder,
  isConnected: true,
  isLoading: false,
  error: null,
  lastUpdate: new Date(),
  refreshOrder: vi.fn(),
  requestNotificationPermission: vi.fn(),
  reconnect: vi.fn(),
};

vi.mocked(require('../../hooks/useOrderTracking').useOrderTracking).mockReturnValue(mockUseOrderTracking);

// Mock router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ orderId: 'order-123' }),
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('OrderTrackingPage - Real-time Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Notification API
    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'default',
        requestPermission: vi.fn(() => Promise.resolve('granted')),
      },
      writable: true,
    });
  });

  it('should render order tracking page with real-time data', async () => {
    renderWithRouter(<OrderTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText('Order Tracking')).toBeInTheDocument();
      expect(screen.getByText('Order #ORD-12345')).toBeInTheDocument();
      expect(screen.getByText('Jollof Rice with Pepper Chicken')).toBeInTheDocument();
    });
  });

  it('should show connection status', async () => {
    renderWithRouter(<OrderTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  it('should show offline status when disconnected', async () => {
    vi.mocked(require('../../hooks/useOrderTracking').useOrderTracking).mockReturnValue({
      ...mockUseOrderTracking,
      isConnected: false,
    });

    renderWithRouter(<OrderTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  it('should display last update time', async () => {
    const lastUpdate = new Date();
    vi.mocked(require('../../hooks/useOrderTracking').useOrderTracking).mockReturnValue({
      ...mockUseOrderTracking,
      lastUpdate,
    });

    renderWithRouter(<OrderTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  it('should show error banner when there is an error', async () => {
    vi.mocked(require('../../hooks/useOrderTracking').useOrderTracking).mockReturnValue({
      ...mockUseOrderTracking,
      error: 'Connection lost',
    });

    renderWithRouter(<OrderTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText('Connection lost')).toBeInTheDocument();
      expect(screen.getByText('Reconnect')).toBeInTheDocument();
    });
  });

  it('should handle reconnect button click', async () => {
    const user = userEvent.setup();
    const mockReconnect = vi.fn();
    
    vi.mocked(require('../../hooks/useOrderTracking').useOrderTracking).mockReturnValue({
      ...mockUseOrderTracking,
      error: 'Connection lost',
      reconnect: mockReconnect,
    });

    renderWithRouter(<OrderTrackingPage />);

    const reconnectButton = screen.getByText('Reconnect');
    await user.click(reconnectButton);

    expect(mockReconnect).toHaveBeenCalled();
  });

  it('should handle refresh button click', async () => {
    const user = userEvent.setup();
    const mockRefreshOrder = vi.fn();
    
    vi.mocked(require('../../hooks/useOrderTracking').useOrderTracking).mockReturnValue({
      ...mockUseOrderTracking,
      refreshOrder: mockRefreshOrder,
    });

    renderWithRouter(<OrderTrackingPage />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(mockRefreshOrder).toHaveBeenCalled();
  });

  it('should show enable notifications button when not enabled', async () => {
    renderWithRouter(<OrderTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
    });
  });

  it('should handle enable notifications click', async () => {
    const user = userEvent.setup();
    const mockRequestPermission = vi.fn(() => Promise.resolve(true));
    
    vi.mocked(require('../../hooks/useOrderTracking').useOrderTracking).mockReturnValue({
      ...mockUseOrderTracking,
      requestNotificationPermission: mockRequestPermission,
    });

    renderWithRouter(<OrderTrackingPage />);

    const enableButton = screen.getByText('Enable Notifications');
    await user.click(enableButton);

    await waitFor(() => {
      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });

  it('should display order status timeline correctly', async () => {
    renderWithRouter(<OrderTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText('Order Received')).toBeInTheDocument();
      expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Preparing')).toBeInTheDocument();
      expect(screen.getByText('Out for Delivery')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('should show pickup status for pickup orders', async () => {
    const pickupOrder = { ...mockOrder, orderType: 'pickup' as const };
    vi.mocked(require('../../hooks/useOrderTracking').useOrderTracking).mockReturnValue({
      ...mockUseOrderTracking,
      order: pickupOrder,
    });

    renderWithRouter(<OrderTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText('Ready for Pickup')).toBeInTheDocument();
    });
  });

  it('should display delivery address for delivery orders', async () => {
    renderWithRouter(<OrderTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText('Delivery Address:')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('New York, NY 10001')).toBeInTheDocument();
    });
  });

  it('should show item customizations', async () => {
    renderWithRouter(<OrderTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText('Extra spicy')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    vi.mocked(require('../../hooks/useOrderTracking').useOrderTracking).mockReturnValue({
      ...mockUseOrderTracking,
      isLoading: true,
      order: null,
    });

    renderWithRouter(<OrderTrackingPage />);

    expect(screen.getByText('Loading order details...')).toBeInTheDocument();
  });

  it('should show error state when order not found', () => {
    vi.mocked(require('../../hooks/useOrderTracking').useOrderTracking).mockReturnValue({
      ...mockUseOrderTracking,
      error: 'Order not found',
      order: null,
    });

    renderWithRouter(<OrderTrackingPage />);

    expect(screen.getByText('Unable to Load Order')).toBeInTheDocument();
    expect(screen.getByText('Order not found')).toBeInTheDocument();
  });

  it('should show completed order with actual ready time', async () => {
    const completedOrder = {
      ...mockOrder,
      status: 'completed' as const,
      actualReadyTime: new Date(Date.now() - 5 * 60 * 1000),
    };
    
    vi.mocked(require('../../hooks/useOrderTracking').useOrderTracking).mockReturnValue({
      ...mockUseOrderTracking,
      order: completedOrder,
    });

    renderWithRouter(<OrderTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText('Completed at')).toBeInTheDocument();
    });
  });

  it('should format prices correctly', async () => {
    renderWithRouter(<OrderTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText('$30.00')).toBeInTheDocument(); // Item total
      expect(screen.getByText('$37.63')).toBeInTheDocument(); // Order total
    });
  });

  it('should show contact information', async () => {
    renderWithRouter(<OrderTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText('Need Help?')).toBeInTheDocument();
      expect(screen.getByText('+1 (234) 567-890')).toBeInTheDocument();
      expect(screen.getByText('support@jollofpalace.com')).toBeInTheDocument();
    });
  });
});