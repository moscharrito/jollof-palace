import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import MultiStepCheckout from '../../components/checkout/MultiStepCheckout';
import { CartItem } from '../../contexts/CartContext';

// Mock the child components
vi.mock('../../components/checkout/CheckoutForm', () => ({
  default: function MockCheckoutForm({ onValidationChange }: any) {
    return (
      <div data-testid="checkout-form">
        <button onClick={() => onValidationChange(true)}>Make Valid</button>
        <button onClick={() => onValidationChange(false)}>Make Invalid</button>
      </div>
    );
  }
}));

vi.mock('../../components/checkout/OrderReview', () => ({
  default: function MockOrderReview() {
    return <div data-testid="order-review">Order Review</div>;
  }
}));

describe('MultiStepCheckout', () => {
  const mockItems: CartItem[] = [
    {
      id: '1',
      menuItemId: 'jollof-chicken',
      name: 'Jollof Rice with Pepper Chicken',
      price: 1500,
      quantity: 2,
      imageUrl: '/images/jollof-chicken.jpg',
    },
  ];

  const mockOnSubmitOrder = vi.fn();

  const defaultProps = {
    items: mockItems,
    subtotal: 3000,
    tax: 263,
    onSubmitOrder: mockOnSubmitOrder,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render progress indicator', () => {
    render(<MultiStepCheckout {...defaultProps} />);

    expect(screen.getByText('Order Information')).toBeInTheDocument();
    expect(screen.getByText('Review Order')).toBeInTheDocument();
  });

  it('should start on form step', () => {
    render(<MultiStepCheckout {...defaultProps} />);

    expect(screen.getByTestId('checkout-form')).toBeInTheDocument();
    expect(screen.queryByTestId('order-review')).not.toBeInTheDocument();
    expect(screen.getByText('Please provide your contact information and delivery preferences')).toBeInTheDocument();
  });

  it('should show correct step title for form step', () => {
    render(<MultiStepCheckout {...defaultProps} />);

    expect(screen.getByText('Order Information')).toBeInTheDocument();
  });

  it('should disable continue button when form is invalid', () => {
    render(<MultiStepCheckout {...defaultProps} />);

    const continueButton = screen.getByText('Continue to Review →');
    expect(continueButton).toBeDisabled();
  });

  it('should enable continue button when form is valid', async () => {
    const user = userEvent.setup();
    render(<MultiStepCheckout {...defaultProps} />);

    const makeValidButton = screen.getByText('Make Valid');
    await user.click(makeValidButton);

    const continueButton = screen.getByText('Continue to Review →');
    expect(continueButton).not.toBeDisabled();
  });

  it('should navigate to review step when continue is clicked', async () => {
    const user = userEvent.setup();
    render(<MultiStepCheckout {...defaultProps} />);

    // Make form valid
    const makeValidButton = screen.getByText('Make Valid');
    await user.click(makeValidButton);

    // Click continue
    const continueButton = screen.getByText('Continue to Review →');
    await user.click(continueButton);

    expect(screen.getByTestId('order-review')).toBeInTheDocument();
    expect(screen.queryByTestId('checkout-form')).not.toBeInTheDocument();
  });

  it('should show correct step title for review step', async () => {
    const user = userEvent.setup();
    render(<MultiStepCheckout {...defaultProps} />);

    // Navigate to review step
    const makeValidButton = screen.getByText('Make Valid');
    await user.click(makeValidButton);
    const continueButton = screen.getByText('Continue to Review →');
    await user.click(continueButton);

    expect(screen.getByText('Review Your Order')).toBeInTheDocument();
    expect(screen.getByText('Please review your order details before proceeding to payment')).toBeInTheDocument();
  });

  it('should show back button on review step', async () => {
    const user = userEvent.setup();
    render(<MultiStepCheckout {...defaultProps} />);

    // Navigate to review step
    const makeValidButton = screen.getByText('Make Valid');
    await user.click(makeValidButton);
    const continueButton = screen.getByText('Continue to Review →');
    await user.click(continueButton);

    expect(screen.getByText('← Back to Information')).toBeInTheDocument();
  });

  it('should navigate back to form step when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<MultiStepCheckout {...defaultProps} />);

    // Navigate to review step
    const makeValidButton = screen.getByText('Make Valid');
    await user.click(makeValidButton);
    const continueButton = screen.getByText('Continue to Review →');
    await user.click(continueButton);

    // Click back button
    const backButton = screen.getByText('← Back to Information');
    await user.click(backButton);

    expect(screen.getByTestId('checkout-form')).toBeInTheDocument();
    expect(screen.queryByTestId('order-review')).not.toBeInTheDocument();
  });

  it('should show place order button on review step', async () => {
    const user = userEvent.setup();
    render(<MultiStepCheckout {...defaultProps} />);

    // Navigate to review step
    const makeValidButton = screen.getByText('Make Valid');
    await user.click(makeValidButton);
    const continueButton = screen.getByText('Continue to Review →');
    await user.click(continueButton);

    expect(screen.getByText('Place Order & Pay')).toBeInTheDocument();
  });

  it('should call onSubmitOrder when place order button is clicked', async () => {
    const user = userEvent.setup();
    render(<MultiStepCheckout {...defaultProps} />);

    // Navigate to review step
    const makeValidButton = screen.getByText('Make Valid');
    await user.click(makeValidButton);
    const continueButton = screen.getByText('Continue to Review →');
    await user.click(continueButton);

    // Click place order
    const placeOrderButton = screen.getByText('Place Order & Pay');
    await user.click(placeOrderButton);

    expect(mockOnSubmitOrder).toHaveBeenCalledWith({
      customerInfo: {
        name: '',
        phone: '',
        email: '',
      },
      orderType: 'delivery',
      specialInstructions: '',
      items: mockItems,
      total: 3763, // subtotal + tax + delivery fee
    });
  });

  it('should show loading state when isLoading is true', () => {
    render(<MultiStepCheckout {...defaultProps} isLoading={true} />);

    // Back button should be disabled
    const makeValidButton = screen.getByText('Make Valid');
    fireEvent.click(makeValidButton);
    const continueButton = screen.getByText('Continue to Review →');
    fireEvent.click(continueButton);

    const backButton = screen.getByText('← Back to Information');
    expect(backButton).toBeDisabled();
  });

  it('should show loading state on place order button', async () => {
    const user = userEvent.setup();
    render(<MultiStepCheckout {...defaultProps} isLoading={true} />);

    // Navigate to review step
    const makeValidButton = screen.getByText('Make Valid');
    await user.click(makeValidButton);
    const continueButton = screen.getByText('Continue to Review →');
    await user.click(continueButton);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
  });

  it('should update progress indicator correctly', async () => {
    const user = userEvent.setup();
    render(<MultiStepCheckout {...defaultProps} />);

    // Initially, step 1 should be active
    const step1 = screen.getByText('1');
    expect(step1).toHaveClass('bg-red-600');

    // Navigate to review step
    const makeValidButton = screen.getByText('Make Valid');
    await user.click(makeValidButton);
    const continueButton = screen.getByText('Continue to Review →');
    await user.click(continueButton);

    // Step 1 should show checkmark, step 2 should be active
    expect(screen.getByText('✓')).toBeInTheDocument();
    const step2 = screen.getByText('2');
    expect(step2).toHaveClass('bg-red-600');
  });

  it('should calculate delivery fee correctly for orders under $25', () => {
    const smallOrderProps = {
      ...defaultProps,
      subtotal: 2000, // $20
    };

    render(<MultiStepCheckout {...smallOrderProps} />);

    // Check mobile order summary
    expect(screen.getByText('Delivery:')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument(); // Delivery fee
  });

  it('should not charge delivery fee for orders over $25', () => {
    const largeOrderProps = {
      ...defaultProps,
      subtotal: 3000, // $30
    };

    render(<MultiStepCheckout {...largeOrderProps} />);

    // Check mobile order summary - delivery should be $0
    const deliveryElements = screen.getAllByText('$0.00');
    expect(deliveryElements.length).toBeGreaterThan(0);
  });

  it('should show mobile order summary on form step', () => {
    render(<MultiStepCheckout {...defaultProps} />);

    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText('Items (1):')).toBeInTheDocument();
    expect(screen.getByText('Tax:')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
  });

  it('should not show mobile order summary on review step', async () => {
    const user = userEvent.setup();
    render(<MultiStepCheckout {...defaultProps} />);

    // Navigate to review step
    const makeValidButton = screen.getByText('Make Valid');
    await user.click(makeValidButton);
    const continueButton = screen.getByText('Continue to Review →');
    await user.click(continueButton);

    // Mobile order summary should not be visible (only the main OrderReview component)
    const orderSummaryElements = screen.queryAllByText('Order Summary');
    expect(orderSummaryElements.length).toBe(0);
  });
});