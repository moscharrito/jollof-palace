import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { toast } from 'react-hot-toast';
import CheckoutPage from '../../pages/CheckoutPage';
import api from '../../services/api';

// Mock dependencies
vi.mock('react-hot-toast');
vi.mock('../../services/api');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock child components
vi.mock('../../components/checkout/MultiStepCheckout', () => ({
  default: function MockMultiStepCheckout({ onSubmitOrder, isLoading }: any) {
    return (
      <div data-testid="multi-step-checkout">
        <button 
          onClick={() => onSubmitOrder({
            customerInfo: { name: 'John Doe', phone: '1234567890' },
            orderType: 'delivery',
            specialInstructions: '',
            items: [],
            total: 1000
          })}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Place Order & Pay'}
        </button>
      </div>
    );
  }
}));

const mockCartItems = [
  {
    id: '1',
    menuItemId: 'jollof-chicken',
    name: 'Jollof Rice with Pepper Chicken',
    price: 1500,
    quantity: 1,
    imageUrl: '/images/jollof-chicken.jpg',
  },
];

// Mock the useCart hook
const mockUseCart = vi.fn();
vi.mock('../../hooks/useCart', () => ({
  useCart: () => mockUseCart(),
}));

const TestWrapper = ({ children }: any) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('CheckoutPage', () => {
  const mockApiPost = api.post as any;
  const mockToast = toast as any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    mockUseCart.mockReturnValue({
      items: mockCartItems,
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      getSubtotal: () => 1500,
      getTax: () => 131,
      getItemCount: () => mockCartItems.length,
    });
  });

  it('should render checkout page with items in cart', () => {
    render(
      <TestWrapper>
        <CheckoutPage />
      </TestWrapper>
    );

    expect(screen.getByText('Checkout')).toBeInTheDocument();
    expect(screen.getByText('Back to Cart')).toBeInTheDocument();
    expect(screen.getByTestId('multi-step-checkout')).toBeInTheDocument();
  });

  it('should show empty cart message when no items', () => {
    mockUseCart.mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      getSubtotal: () => 0,
      getTax: () => 0,
      getItemCount: () => 0,
    });

    render(
      <TestWrapper>
        <CheckoutPage />
      </TestWrapper>
    );

    expect(screen.getByText('No items in cart')).toBeInTheDocument();
    expect(screen.getByText('Please add items to your cart before proceeding to checkout.')).toBeInTheDocument();
    expect(screen.getByText('Browse Menu')).toBeInTheDocument();
  });

  it('should handle successful order submission', async () => {
    const user = userEvent.setup();
    const mockOrderResponse = {
      data: {
        data: {
          id: 'order-123',
          orderNumber: 'ORD-001',
        },
      },
    };

    mockApiPost.mockResolvedValueOnce(mockOrderResponse);

    render(
      <TestWrapper>
        <CheckoutPage />
      </TestWrapper>
    );

    const submitButton = screen.getByText('Place Order & Pay');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/orders', {
        customerInfo: { name: 'John Doe', phone: '1234567890' },
        items: [],
        orderType: 'delivery',
        specialInstructions: '',
      });
    });

    expect(mockToast.success).toHaveBeenCalledWith('Order placed successfully!');
  });

  it('should handle order submission error', async () => {
    const user = userEvent.setup();
    const mockError = {
      response: {
        data: {
          message: 'Order creation failed',
        },
      },
    };

    mockApiPost.mockRejectedValueOnce(mockError);

    render(
      <TestWrapper>
        <CheckoutPage />
      </TestWrapper>
    );

    const submitButton = screen.getByText('Place Order & Pay');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Order creation failed');
    });
  });

  it('should handle validation errors', async () => {
    const user = userEvent.setup();
    const mockError = {
      response: {
        data: {
          message: 'Validation failed',
          error: {
            details: [
              { field: 'name', message: 'Name is required' },
              { field: 'phone', message: 'Phone is required' },
            ],
          },
        },
      },
    };

    mockApiPost.mockRejectedValueOnce(mockError);

    render(
      <TestWrapper>
        <CheckoutPage />
      </TestWrapper>
    );

    const submitButton = screen.getByText('Place Order & Pay');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Validation failed');
      expect(mockToast.error).toHaveBeenCalledWith('name: Name is required');
      expect(mockToast.error).toHaveBeenCalledWith('phone: Phone is required');
    });
  });

  it('should show loading state during order submission', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    mockApiPost.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <TestWrapper>
        <CheckoutPage />
      </TestWrapper>
    );

    const submitButton = screen.getByText('Place Order & Pay');
    await user.click(submitButton);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should have proper navigation link', () => {
    render(
      <TestWrapper>
        <CheckoutPage />
      </TestWrapper>
    );

    const backLink = screen.getByText('Back to Cart');
    expect(backLink.closest('a')).toHaveAttribute('href', '/cart');
  });
});