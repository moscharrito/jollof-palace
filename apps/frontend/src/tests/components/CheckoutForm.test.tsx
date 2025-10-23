import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CheckoutForm from '../../components/checkout/CheckoutForm';
import { CustomerInfo } from '@food-ordering/shared';

describe('CheckoutForm', () => {
  const mockCustomerInfo: CustomerInfo = {
    name: '',
    phone: '',
    email: '',
  };

  const defaultProps = {
    customerInfo: mockCustomerInfo,
    orderType: 'delivery' as const,
    specialInstructions: '',
    onCustomerInfoChange: vi.fn(),
    onOrderTypeChange: vi.fn(),
    onSpecialInstructionsChange: vi.fn(),
    onValidationChange: vi.fn(),
  };

  // Helper function to render CheckoutForm with state management
  const renderWithState = (initialCustomerInfo: CustomerInfo = mockCustomerInfo, orderType: 'pickup' | 'delivery' = 'delivery') => {
    const TestWrapper = () => {
      const [customerInfo, setCustomerInfo] = React.useState<CustomerInfo>(initialCustomerInfo);
      const [currentOrderType, setOrderType] = React.useState<'pickup' | 'delivery'>(orderType);
      const [specialInstructions, setSpecialInstructions] = React.useState('');
      
      return (
        <CheckoutForm
          customerInfo={customerInfo}
          orderType={currentOrderType}
          specialInstructions={specialInstructions}
          onCustomerInfoChange={setCustomerInfo}
          onOrderTypeChange={setOrderType}
          onSpecialInstructionsChange={setSpecialInstructions}
          onValidationChange={vi.fn()}
        />
      );
    };
    
    return render(<TestWrapper />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all form sections', () => {
    render(<CheckoutForm {...defaultProps} />);

    expect(screen.getByText('Order Type')).toBeInTheDocument();
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('Delivery Address')).toBeInTheDocument();
    expect(screen.getByText('Special Instructions')).toBeInTheDocument();
  });

  it('should show delivery and pickup options', () => {
    render(<CheckoutForm {...defaultProps} />);

    expect(screen.getByText('Delivery')).toBeInTheDocument();
    expect(screen.getByText('Pickup')).toBeInTheDocument();
    expect(screen.getByText('30-45 min')).toBeInTheDocument();
    expect(screen.getByText('15-20 min')).toBeInTheDocument();
  });

  it('should handle order type change', async () => {
    const user = userEvent.setup();
    render(<CheckoutForm {...defaultProps} />);

    const pickupOption = screen.getByRole('radio', { name: /pickup/i });
    await user.click(pickupOption);

    expect(defaultProps.onOrderTypeChange).toHaveBeenCalledWith('pickup');
  });

  it('should hide delivery address for pickup orders', () => {
    render(<CheckoutForm {...defaultProps} orderType="pickup" />);

    expect(screen.queryByText('Delivery Address')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('123 Main Street, Apt 4B')).not.toBeInTheDocument();
  });

  it('should show delivery address for delivery orders', () => {
    render(<CheckoutForm {...defaultProps} orderType="delivery" />);

    expect(screen.getByText('Delivery Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('123 Main Street, Apt 4B')).toBeInTheDocument();
  });

  it('should handle customer info changes', async () => {
    const user = userEvent.setup();
    render(<CheckoutForm {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('John Doe');
    await user.type(nameInput, 'Jane Smith');

    // Check that the final call has the complete name
    const calls = defaultProps.onCustomerInfoChange.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toEqual({
      ...mockCustomerInfo,
      name: 'Jane Smith',
    });
  });

  it('should handle phone number input', async () => {
    const user = userEvent.setup();
    render(<CheckoutForm {...defaultProps} />);

    const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');
    await user.type(phoneInput, '1234567890');

    // Check that the final call has the complete phone number (digits only)
    const calls = defaultProps.onCustomerInfoChange.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toEqual({
      ...mockCustomerInfo,
      phone: '1234567890',
    });
  });

  it('should handle email input', async () => {
    const user = userEvent.setup();
    render(<CheckoutForm {...defaultProps} />);

    const emailInput = screen.getByPlaceholderText('john@example.com');
    await user.type(emailInput, 'jane@example.com');

    // Check that the final call has the complete email
    const calls = defaultProps.onCustomerInfoChange.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toEqual({
      ...mockCustomerInfo,
      email: 'jane@example.com',
    });
  });

  it('should handle delivery address changes', async () => {
    const user = userEvent.setup();
    render(<CheckoutForm {...defaultProps} orderType="delivery" />);

    const streetInput = screen.getByPlaceholderText('123 Main Street, Apt 4B');
    await user.type(streetInput, '456 Oak Ave');

    // Check that the final call has the complete street address
    const calls = defaultProps.onCustomerInfoChange.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toEqual({
      ...mockCustomerInfo,
      deliveryAddress: {
        street: '456 Oak Ave',
        city: '',
        state: '',
        postalCode: '',
        landmark: '',
      },
    });
  });

  it('should handle special instructions', async () => {
    const user = userEvent.setup();
    render(<CheckoutForm {...defaultProps} />);

    const instructionsTextarea = screen.getByPlaceholderText('Any special requests or dietary requirements...');
    await user.type(instructionsTextarea, 'No onions please');

    // Check that the final call has the complete instructions
    const calls = defaultProps.onSpecialInstructionsChange.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toBe('No onions please');
  });

  it('should show character count for special instructions', () => {
    render(<CheckoutForm {...defaultProps} specialInstructions="Test instructions" />);

    expect(screen.getByText('17/500 characters')).toBeInTheDocument();
  });

  it('should show validation errors for required fields', async () => {
    const user = userEvent.setup();
    renderWithState();

    // Focus and blur name field to trigger validation
    const nameInput = screen.getByPlaceholderText('John Doe');
    await user.click(nameInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
    });
  });

  it('should show validation errors for invalid email', async () => {
    const user = userEvent.setup();
    renderWithState();

    const emailInput = screen.getByPlaceholderText('john@example.com');
    await user.type(emailInput, 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('should show validation errors for invalid phone', async () => {
    const user = userEvent.setup();
    renderWithState();

    const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');
    await user.type(phoneInput, '123');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number (e.g., (555) 123-4567)')).toBeInTheDocument();
    });
  });

  it('should show validation errors for delivery address when delivery is selected', async () => {
    const user = userEvent.setup();
    renderWithState(mockCustomerInfo, 'delivery');

    const streetInput = screen.getByPlaceholderText('123 Main Street, Apt 4B');
    await user.click(streetInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Street address is required')).toBeInTheDocument();
    });
  });

  it('should not show delivery address validation errors for pickup', async () => {
    const user = userEvent.setup();
    render(<CheckoutForm {...defaultProps} orderType="pickup" />);

    // Switch to delivery first to potentially trigger validation
    const deliveryOption = screen.getByRole('radio', { name: /delivery/i });
    await user.click(deliveryOption);

    // Then switch back to pickup
    const pickupOption = screen.getByRole('radio', { name: /pickup/i });
    await user.click(pickupOption);

    expect(screen.queryByText('Street address is required')).not.toBeInTheDocument();
  });

  it('should call onValidationChange when form validity changes', async () => {
    const user = userEvent.setup();
    render(<CheckoutForm {...defaultProps} />);

    // Fill in required fields
    const nameInput = screen.getByPlaceholderText('John Doe');
    const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');

    await user.type(nameInput, 'John Doe');
    await user.type(phoneInput, '1234567890');

    await waitFor(() => {
      expect(defaultProps.onValidationChange).toHaveBeenCalledWith(false); // Still invalid due to delivery address
    });
  });

  it('should have proper accessibility attributes', () => {
    render(<CheckoutForm {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('John Doe');
    expect(nameInput).toHaveAttribute('aria-invalid', 'false');

    const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');
    expect(phoneInput).toHaveAttribute('aria-invalid', 'false');
  });

  it('should update accessibility attributes when validation fails', async () => {
    const user = userEvent.setup();
    renderWithState();

    const nameInput = screen.getByPlaceholderText('John Doe');
    await user.click(nameInput);
    await user.tab();

    await waitFor(() => {
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
    });
  });

  it('should show validation summary when there are errors', async () => {
    const user = userEvent.setup();
    renderWithState();

    // Trigger validation errors
    const nameInput = screen.getByPlaceholderText('John Doe');
    const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');
    
    await user.click(nameInput);
    await user.tab();
    await user.click(phoneInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument();
      expect(screen.getByText('• Full name is required')).toBeInTheDocument();
      expect(screen.getByText('• Phone number is required')).toBeInTheDocument();
    });
  });

  it('should format phone number as user types', async () => {
    const user = userEvent.setup();
    renderWithState();

    const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');
    await user.type(phoneInput, '1234567890');

    // Check that the input shows formatted phone number
    expect(phoneInput).toHaveValue('(123) 456-7890');
  });

  it('should show helpful text for phone and postal code fields', () => {
    render(<CheckoutForm {...defaultProps} orderType="delivery" />);

    expect(screen.getByText('Enter your phone number for order updates')).toBeInTheDocument();
    expect(screen.getByText('ZIP code, postal code, or area code')).toBeInTheDocument();
  });

  it('should convert postal code to uppercase', async () => {
    const user = userEvent.setup();
    render(<CheckoutForm {...defaultProps} orderType="delivery" />);

    const postalInput = screen.getByPlaceholderText('10001 or M5V 3A8');
    await user.type(postalInput, 'm5v3a8');

    // Check that the final call has uppercase postal code
    const calls = defaultProps.onCustomerInfoChange.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0].deliveryAddress?.postalCode).toBe('M5V3A8');
  });
});