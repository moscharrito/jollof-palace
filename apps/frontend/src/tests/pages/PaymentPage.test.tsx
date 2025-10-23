import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { toast } from 'react-hot-toast';
import PaymentPage from '../../pages/PaymentPage';
import api from '../../services/api';
import { Order } from '@food-ordering/shared';

// Mock dependencies
vi.mock('react-hot-toast');
vi.mock('../../services/api');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ orderId: 'test-order-id' }),
    useLocation: () => ({ state: { order: mockOrder } }),
    useNavigate: () => vi.fn(),
  };
});

// Mock payment components
vi.mock('../../components/payment/PaymentMethodSelector', () => ({
  default: ({ selectedMethod, onMethodChange }: any) => (
    <div data-testid="payment-method-selector">
      <button onClick={() => onMethodChange('card')}>Card</button>
      <button onClick={() => onMethodChange('paypal')}>PayPal</button>
      <span>Selected: {selectedMethod}</span>
    </div>
  ),
}));

vi.mock('../../components/payment/StripePaymentForm', () => ({
  default: ({ order, onSuccess, onError }: any) => (
    <div data-testid="stripe-payment-form">
      <button onClick={() => onSuccess('stripe-tx-123', 'stripe-ref-123')}>
        Pay with Stripe
      </button>
      <button onClick={() => onError('Stripe payment failed')}>
        Simulate Error
      </button>
    </div>
  ),
}));

vi.mock('../../components/payment/PayPalPaymentButton', () => ({
  default: ({ order, onSuccess, onError }: any) => (
    <div data-testid="paypal-payment-button">
      <button onClick={() => onSuccess('paypal-tx-123', 'paypal-ref-123')}>
        Pay with PayPal
      </button>
    </div>
  ),
}));

const mockOrder: Order = {
  id: 'test-order-id',
  orderNumber: 'ORD-12345',
  customerInfo: {
    name: 'John Doe',
    phone: '1234567890',
    email: 'john@example.com',
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
    },
  ],
  subtotal: 3000,
  tax: 263,
  total: 3763,
  status: 'pending',
  orderType: 'delivery',
  estimatedReadyTime: new Date(),
  paymentStatus: 'pending',
  paymentMethod: '',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PaymentPage', () => {
  const mockApi = api as any;
  const mockToast = toast as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render payment page with order summary', async () => {
    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('Complete Payment')).toBeInTheDocument();
      expect(screen.getByText('Secure payment for Order #ORD-12345')).toBeInTheDocument();
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('ORD-12345')).toBeInTheDocument();
    });
  });

  it('should display order details correctly', async () => {
    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('$30.00')).toBeInTheDocument(); // Subtotal
      expect(screen.getByText('$2.63')).toBeInTheDocument(); // Tax
      expect(screen.getByText('$37.63')).toBeInTheDocument(); // Total
    });
  });

  it('should render payment method selector', async () => {
    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByTestId('payment-method-selector')).toBeInTheDocument();
      expect(screen.getByText('Choose Payment Method')).toBeInTheDocument();
    });
  });

  it('should render stripe payment form by default', async () => {
    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByTestId('stripe-payment-form')).toBeInTheDocument();
    });
  });

  it('should switch payment methods when selected', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByTestId('payment-method-selector')).toBeInTheDocument();
    });

    const paypalButton = screen.getByText('PayPal');
    await user.click(paypalButton);

    await waitFor(() => {
      expect(screen.getByTestId('paypal-payment-button')).toBeInTheDocument();
    });
  });

  it('should handle successful payment', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByTestId('stripe-payment-form')).toBeInTheDocument();
    });

    const payButton = screen.getByText('Pay with Stripe');
    await user.click(payButton);

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Payment processed successfully!');
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/payment/success')
      );
    });
  });

  it('should handle payment error', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByTestId('stripe-payment-form')).toBeInTheDocument();
    });

    const errorButton = screen.getByText('Simulate Error');
    await user.click(errorButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Stripe payment failed');
      expect(screen.getByText('Stripe payment failed')).toBeInTheDocument();
    });
  });

  it('should show loading state when fetching order', () => {
    // Mock location state without order
    vi.mocked(require('react-router-dom').useLocation).mockReturnValue({ state: null });
    
    renderWithRouter(<PaymentPage />);

    expect(screen.getByText('Loading payment details...')).toBeInTheDocument();
  });

  it('should show error state for invalid order status', () => {
    const completedOrder = { ...mockOrder, status: 'completed' };
    vi.mocked(require('react-router-dom').useLocation).mockReturnValue({ 
      state: { order: completedOrder } 
    });

    renderWithRouter(<PaymentPage />);

    expect(screen.getByText('Order Already Processed')).toBeInTheDocument();
    expect(screen.getByText('This order has already been processed and cannot be paid for again.')).toBeInTheDocument();
  });

  it('should show security notice', async () => {
    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('Secure Payment')).toBeInTheDocument();
      expect(screen.getByText(/Your payment information is encrypted and secure/)).toBeInTheDocument();
    });
  });

  it('should handle back navigation', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

    renderWithRouter(<PaymentPage />);

    const backButton = screen.getByText('Back');
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should fetch order details when not provided in state', async () => {
    vi.mocked(require('react-router-dom').useLocation).mockReturnValue({ state: null });
    mockApi.get.mockResolvedValueOnce({
      data: { data: mockOrder }
    });

    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/orders/test-order-id');
    });
  });

  it('should handle fetch order error', async () => {
    vi.mocked(require('react-router-dom').useLocation).mockReturnValue({ state: null });
    mockApi.get.mockRejectedValueOnce(new Error('Order not found'));

    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('Payment Error')).toBeInTheDocument();
      expect(mockToast.error).toHaveBeenCalledWith('Failed to load order details');
    });
  });
});