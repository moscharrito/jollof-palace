import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { toast } from 'react-hot-toast';
import CheckoutPage from '../../pages/CheckoutPage';
import { CartProvider } from '../../contexts/CartContext';
import api from '../../services/api';

// Mock dependencies
vi.mock('react-hot-toast');
vi.mock('../../services/api');

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    confirmCardPayment: vi.fn(() => Promise.resolve({
      paymentIntent: { id: 'pi_test_123', status: 'succeeded' }
    }))
  }))
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => children,
  CardElement: () => <div data-testid="card-element">Card Element</div>,
  useStripe: () => ({
    confirmCardPayment: vi.fn(() => Promise.resolve({
      paymentIntent: { id: 'pi_test_123', status: 'succeeded' }
    }))
  }),
  useElements: () => ({
    getElement: vi.fn(() => ({}))
  })
}));

const mockCartItems = [
  {
    id: '1',
    menuItemId: 'jollof-chicken',
    name: 'Jollof Rice with Pepper Chicken',
    price: 1500,
    quantity: 2,
    imageUrl: '/images/jollof-chicken.jpg',
  },
];

const mockOrder = {
  id: 'order-123',
  orderNumber: 'ORD-001',
  customerInfo: {
    name: 'John Doe',
    phone: '1234567890',
    email: 'john@example.com',
  },
  items: mockCartItems,
  subtotal: 3000,
  tax: 263,
  total: 3763,
  status: 'pending',
  orderType: 'pickup',
  estimatedReadyTime: new Date(),
  paymentStatus: 'pending',
  paymentMethod: '',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const CartProviderWrapper = ({ children }: any) => {
  const mockCartValue = {
    items: mockCartItems,
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    getSubtotal: () => 3000,
    getTax: () => 263,
    getItemCount: () => 2,
  };

  return (
    <CartProvider value={mockCartValue}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </CartProvider>
  );
};

describe('Complete Payment Flow Integration', () => {
  const mockApi = api as any;
  const mockToast = toast as any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful order creation
    mockApi.post.mockImplementation((url: string) => {
      if (url === '/orders') {
        return Promise.resolve({
          data: { data: mockOrder }
        });
      }
      if (url === '/payments/stripe/create-intent') {
        return Promise.resolve({
          data: { data: { clientSecret: 'pi_test_client_secret' } }
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('should complete full checkout to payment flow', async () => {
    const user = userEvent.setup();
    
    // Mock navigation
    const mockNavigate = vi.fn();
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    // Start with checkout page
    render(
      <CartProviderWrapper>
        <CheckoutPage />
      </CartProviderWrapper>
    );

    // Fill out checkout form
    const nameInput = screen.getByPlaceholderText('John Doe');
    const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');
    
    await user.type(nameInput, 'John Doe');
    await user.type(phoneInput, '1234567890');

    // Select pickup to avoid address validation
    const pickupOption = screen.getByRole('radio', { name: /pickup/i });
    await user.click(pickupOption);

    // Continue to review
    const continueButton = screen.getByText('Continue to Review →');
    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });
    await user.click(continueButton);

    // Submit order
    await waitFor(() => {
      expect(screen.getByText('Place Order & Pay')).toBeInTheDocument();
    });
    
    const placeOrderButton = screen.getByText('Place Order & Pay');
    await user.click(placeOrderButton);

    // Verify order creation and navigation to payment
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/orders', expect.any(Object));
      expect(mockToast.success).toHaveBeenCalledWith('Order placed successfully!');
      expect(mockNavigate).toHaveBeenCalledWith(
        '/payment/order-123',
        expect.objectContaining({
          state: expect.objectContaining({
            order: mockOrder
          })
        })
      );
    });
  });

  it('should handle payment processing on payment page', async () => {
    
    // Mock payment page with order in state
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useParams: () => ({ orderId: 'order-123' }),
        useLocation: () => ({ state: { order: mockOrder } }),
        useNavigate: () => vi.fn(),
      };
    });

    const { PaymentPage } = await import('../../pages/PaymentPage');
    
    render(
      <BrowserRouter>
        <PaymentPage />
      </BrowserRouter>
    );

    // Wait for payment page to load
    await waitFor(() => {
      expect(screen.getByText('Complete Payment')).toBeInTheDocument();
      expect(screen.getByText('Secure payment for Order #ORD-001')).toBeInTheDocument();
    });

    // Verify order summary
    expect(screen.getByText('$30.00')).toBeInTheDocument(); // Subtotal
    expect(screen.getByText('$37.63')).toBeInTheDocument(); // Total

    // Verify payment method selector is present
    expect(screen.getByText('Choose Payment Method')).toBeInTheDocument();
  });

  it('should handle checkout validation errors', async () => {
    const user = userEvent.setup();
    
    render(
      <CartProviderWrapper>
        <CheckoutPage />
      </CartProviderWrapper>
    );

    // Try to continue without filling required fields
    const continueButton = screen.getByText('Continue to Review →');
    expect(continueButton).toBeDisabled();

    // Fill only name
    const nameInput = screen.getByPlaceholderText('John Doe');
    await user.type(nameInput, 'John Doe');

    // Should still be disabled without phone
    expect(continueButton).toBeDisabled();
  });

  it('should handle order creation errors', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    mockApi.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Order creation failed',
          error: {
            details: [
              { field: 'phone', message: 'Invalid phone number' }
            ]
          }
        }
      }
    });

    render(
      <CartProviderWrapper>
        <CheckoutPage />
      </CartProviderWrapper>
    );

    // Fill out form
    const nameInput = screen.getByPlaceholderText('John Doe');
    const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');
    
    await user.type(nameInput, 'John Doe');
    await user.type(phoneInput, '1234567890');

    const pickupOption = screen.getByRole('radio', { name: /pickup/i });
    await user.click(pickupOption);

    // Continue to review
    const continueButton = screen.getByText('Continue to Review →');
    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });
    await user.click(continueButton);

    // Submit order
    const placeOrderButton = screen.getByText('Place Order & Pay');
    await user.click(placeOrderButton);

    // Verify error handling
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Order creation failed');
      expect(mockToast.error).toHaveBeenCalledWith('phone: Invalid phone number');
    });
  });

  it('should handle empty cart scenario', () => {
    const EmptyCartWrapper = ({ children }: any) => {
      const mockCartValue = {
        items: [],
        addItem: vi.fn(),
        removeItem: vi.fn(),
        updateQuantity: vi.fn(),
        clearCart: vi.fn(),
        getSubtotal: () => 0,
        getTax: () => 0,
        getItemCount: () => 0,
      };

      return (
        <CartProvider value={mockCartValue}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </CartProvider>
      );
    };

    render(
      <EmptyCartWrapper>
        <CheckoutPage />
      </EmptyCartWrapper>
    );

    expect(screen.getByText('No items in cart')).toBeInTheDocument();
    expect(screen.getByText('Please add items to your cart before proceeding to checkout.')).toBeInTheDocument();
  });

  it('should preserve form data when navigating between steps', async () => {
    const user = userEvent.setup();
    
    render(
      <CartProviderWrapper>
        <CheckoutPage />
      </CartProviderWrapper>
    );

    // Fill out form
    const nameInput = screen.getByPlaceholderText('John Doe');
    const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');
    
    await user.type(nameInput, 'Jane Smith');
    await user.type(phoneInput, '9876543210');

    const pickupOption = screen.getByRole('radio', { name: /pickup/i });
    await user.click(pickupOption);

    // Continue to review
    const continueButton = screen.getByText('Continue to Review →');
    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });
    await user.click(continueButton);

    // Verify data is shown in review
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('(987) 654-3210')).toBeInTheDocument();
    });

    // Go back to form
    const backButton = screen.getByText('← Back to Information');
    await user.click(backButton);

    // Verify data is preserved
    await waitFor(() => {
      expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
    });
  });
});