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
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockCartItems = [
  {
    id: '1',
    menuItemId: 'jollof-chicken',
    name: 'Jollof Rice with Pepper Chicken',
    price: 1500,
    quantity: 2,
    imageUrl: '/images/jollof-chicken.jpg',
  },
  {
    id: '2',
    menuItemId: 'dodo',
    name: 'Dodo (Fried Plantain)',
    price: 800,
    quantity: 1,
    imageUrl: '/images/dodo.jpg',
  },
];

const CartProviderWrapper = ({ children }: any) => {
  const mockCartValue = {
    items: mockCartItems,
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    getSubtotal: () => 3800,
    getTax: () => 333,
    getItemCount: () => 3,
  };

  return (
    <CartProvider value={mockCartValue}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </CartProvider>
  );
};

describe('Checkout Flow Integration', () => {
  const mockApiPost = api.post as any;
  const mockToast = toast as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full checkout flow for delivery order', async () => {
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
      <CartProviderWrapper>
        <CheckoutPage />
      </CartProviderWrapper>
    );

    // Verify we're on the form step
    expect(screen.getByText('Order Information')).toBeInTheDocument();
    expect(screen.getByText('Please provide your contact information and delivery preferences')).toBeInTheDocument();

    // Fill in customer information
    const nameInput = screen.getByPlaceholderText('John Doe');
    const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');
    const emailInput = screen.getByPlaceholderText('john@example.com');

    await user.type(nameInput, 'Jane Smith');
    await user.type(phoneInput, '1234567890');
    await user.type(emailInput, 'jane@example.com');

    // Verify delivery is selected by default
    const deliveryOption = screen.getByRole('radio', { name: /delivery/i });
    expect(deliveryOption).toBeChecked();

    // Fill in delivery address
    const streetInput = screen.getByPlaceholderText('123 Main Street, Apt 4B');
    const cityInput = screen.getByPlaceholderText('New York');
    const stateInput = screen.getByPlaceholderText('NY');
    const postalInput = screen.getByPlaceholderText('10001');

    await user.type(streetInput, '456 Oak Avenue');
    await user.type(cityInput, 'Los Angeles');
    await user.type(stateInput, 'CA');
    await user.type(postalInput, '90210');

    // Add special instructions
    const instructionsTextarea = screen.getByPlaceholderText('Any special requests or dietary requirements...');
    await user.type(instructionsTextarea, 'Please ring the doorbell twice');

    // Continue to review step
    const continueButton = screen.getByText('Continue to Review →');
    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });
    await user.click(continueButton);

    // Verify we're on the review step
    await waitFor(() => {
      expect(screen.getByText('Review Your Order')).toBeInTheDocument();
      expect(screen.getByText('Please review your order details before proceeding to payment')).toBeInTheDocument();
    });

    // Verify order items are displayed
    expect(screen.getByText('Order Items (2 items)')).toBeInTheDocument();
    expect(screen.getByText('Jollof Rice with Pepper Chicken')).toBeInTheDocument();
    expect(screen.getByText('Dodo (Fried Plantain)')).toBeInTheDocument();

    // Verify customer information is displayed
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('(123) 456-7890')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();

    // Verify delivery information is displayed
    expect(screen.getByText('Delivery Information')).toBeInTheDocument();
    expect(screen.getByText('456 Oak Avenue')).toBeInTheDocument();
    expect(screen.getByText('Los Angeles, CA 90210')).toBeInTheDocument();

    // Verify special instructions are displayed
    expect(screen.getByText('Please ring the doorbell twice')).toBeInTheDocument();

    // Verify order total is displayed
    expect(screen.getByText('Order Total')).toBeInTheDocument();
    expect(screen.getByText('$38.00')).toBeInTheDocument(); // Subtotal
    expect(screen.getByText('$3.33')).toBeInTheDocument(); // Tax

    // Submit the order
    const placeOrderButton = screen.getByText('Place Order & Pay');
    await user.click(placeOrderButton);

    // Verify API call was made with correct data
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/orders', {
        customerInfo: {
          name: 'Jane Smith',
          phone: '1234567890',
          email: 'jane@example.com',
          deliveryAddress: {
            street: '456 Oak Avenue',
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90210',
            landmark: '',
          },
        },
        items: [
          {
            menuItemId: 'jollof-chicken',
            quantity: 2,
            customizations: undefined,
          },
          {
            menuItemId: 'dodo',
            quantity: 1,
            customizations: undefined,
          },
        ],
        orderType: 'delivery',
        specialInstructions: 'Please ring the doorbell twice',
      });
    });

    expect(mockToast.success).toHaveBeenCalledWith('Order placed successfully!');
  });

  it('should complete full checkout flow for pickup order', async () => {
    const user = userEvent.setup();
    const mockOrderResponse = {
      data: {
        data: {
          id: 'order-456',
          orderNumber: 'ORD-002',
        },
      },
    };

    mockApiPost.mockResolvedValueOnce(mockOrderResponse);

    render(
      <CartProviderWrapper>
        <CheckoutPage />
      </CartProviderWrapper>
    );

    // Fill in customer information
    const nameInput = screen.getByPlaceholderText('John Doe');
    const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');

    await user.type(nameInput, 'Bob Johnson');
    await user.type(phoneInput, '9876543210');

    // Select pickup option
    const pickupOption = screen.getByRole('radio', { name: /pickup/i });
    await user.click(pickupOption);

    // Verify delivery address fields are not shown
    expect(screen.queryByPlaceholderText('123 Main Street, Apt 4B')).not.toBeInTheDocument();

    // Continue to review step
    const continueButton = screen.getByText('Continue to Review →');
    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });
    await user.click(continueButton);

    // Verify pickup information is displayed
    await waitFor(() => {
      expect(screen.getByText('Pickup Information')).toBeInTheDocument();
      expect(screen.getByText('Jollof Palace Restaurant')).toBeInTheDocument();
      expect(screen.getByText('15-20 minutes')).toBeInTheDocument();
    });

    // Submit the order
    const placeOrderButton = screen.getByText('Place Order & Pay');
    await user.click(placeOrderButton);

    // Verify API call was made with correct data
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/orders', {
        customerInfo: {
          name: 'Bob Johnson',
          phone: '9876543210',
          email: '',
        },
        items: [
          {
            menuItemId: 'jollof-chicken',
            quantity: 2,
            customizations: undefined,
          },
          {
            menuItemId: 'dodo',
            quantity: 1,
            customizations: undefined,
          },
        ],
        orderType: 'pickup',
        specialInstructions: '',
      });
    });
  });

  it('should handle navigation between steps', async () => {
    const user = userEvent.setup();

    render(
      <CartProviderWrapper>
        <CheckoutPage />
      </CartProviderWrapper>
    );

    // Fill in minimum required information
    const nameInput = screen.getByPlaceholderText('John Doe');
    const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');
    await user.type(nameInput, 'Test User');
    await user.type(phoneInput, '1234567890');

    // Switch to pickup to avoid delivery address validation
    const pickupOption = screen.getByRole('radio', { name: /pickup/i });
    await user.click(pickupOption);

    // Go to review step
    const continueButton = screen.getByText('Continue to Review →');
    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });
    await user.click(continueButton);

    // Verify we're on review step
    await waitFor(() => {
      expect(screen.getByText('Review Your Order')).toBeInTheDocument();
    });

    // Go back to form step
    const backButton = screen.getByText('← Back to Information');
    await user.click(backButton);

    // Verify we're back on form step
    await waitFor(() => {
      expect(screen.getByText('Order Information')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('John Doe')).toHaveValue('Test User');
    });
  });

  it('should show loading state during order submission', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    mockApiPost.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <CartProviderWrapper>
        <CheckoutPage />
      </CartProviderWrapper>
    );

    // Fill in minimum required information and go to review
    const nameInput = screen.getByPlaceholderText('John Doe');
    const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');
    await user.type(nameInput, 'Test User');
    await user.type(phoneInput, '1234567890');

    const pickupOption = screen.getByRole('radio', { name: /pickup/i });
    await user.click(pickupOption);

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

    // Verify loading state
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
  });

  it('should prevent form submission with invalid data', async () => {
    const user = userEvent.setup();

    render(
      <CartProviderWrapper>
        <CheckoutPage />
      </CartProviderWrapper>
    );

    // Try to continue without filling required fields
    const continueButton = screen.getByText('Continue to Review →');
    expect(continueButton).toBeDisabled();

    // Fill in only name
    const nameInput = screen.getByPlaceholderText('John Doe');
    await user.type(nameInput, 'Test User');

    // Should still be disabled
    expect(continueButton).toBeDisabled();

    // Fill in phone with invalid format
    const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');
    await user.type(phoneInput, '123');

    // Should still be disabled
    expect(continueButton).toBeDisabled();
  });
});