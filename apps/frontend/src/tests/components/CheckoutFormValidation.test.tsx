import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CheckoutForm from '../../components/checkout/CheckoutForm';
import { CustomerInfo } from '@food-ordering/shared';

describe('CheckoutForm Validation', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Required Field Validation', () => {
    it('should validate name field is required', async () => {
      const user = userEvent.setup();
      render(<CheckoutForm {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('John Doe');
      await user.click(nameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument();
      });
    });

    it('should validate phone field is required', async () => {
      const user = userEvent.setup();
      render(<CheckoutForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');
      await user.click(phoneInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      });
    });

    it('should validate delivery address fields when delivery is selected', async () => {
      const user = userEvent.setup();
      render(<CheckoutForm {...defaultProps} orderType="delivery" />);

      // Test street address
      const streetInput = screen.getByPlaceholderText('123 Main Street, Apt 4B');
      await user.click(streetInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Street address is required')).toBeInTheDocument();
      });

      // Test city
      const cityInput = screen.getByPlaceholderText('New York');
      await user.click(cityInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('City is required')).toBeInTheDocument();
      });

      // Test state
      const stateInput = screen.getByPlaceholderText('NY');
      await user.click(stateInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('State is required')).toBeInTheDocument();
      });

      // Test postal code
      const postalInput = screen.getByPlaceholderText('10001');
      await user.click(postalInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('ZIP code is required')).toBeInTheDocument();
      });
    });
  });

  describe('Format Validation', () => {
    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<CheckoutForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('john@example.com');
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should validate phone number format', async () => {
      const user = userEvent.setup();
      render(<CheckoutForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');
      await user.type(phoneInput, '123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number (e.g., (555) 123-4567)')).toBeInTheDocument();
      });
    });

    it('should accept valid phone number formats', async () => {
      const user = userEvent.setup();
      const onCustomerInfoChange = vi.fn();
      render(<CheckoutForm {...defaultProps} onCustomerInfoChange={onCustomerInfoChange} />);

      const phoneInput = screen.getByPlaceholderText('+1 (234) 567-8900');
      
      // Test various valid formats
      await user.clear(phoneInput);
      await user.type(phoneInput, '1234567890');
      expect(onCustomerInfoChange).toHaveBeenCalledWith({
        ...mockCustomerInfo,
        phone: '1234567890',
      });

      await user.clear(phoneInput);
      await user.type(phoneInput, '(123) 456-7890');
      expect(onCustomerInfoChange).toHaveBeenCalledWith({
        ...mockCustomerInfo,
        phone: '(123) 456-7890',
      });
    });

    it('should accept valid email formats', async () => {
      const user = userEvent.setup();
      const onCustomerInfoChange = vi.fn();
      render(<CheckoutForm {...defaultProps} onCustomerInfoChange={onCustomerInfoChange} />);

      const emailInput = screen.getByPlaceholderText('john@example.com');
      await user.type(emailInput, 'test@example.com');

      expect(onCustomerInfoChange).toHaveBeenCalledWith({
        ...mockCustomerInfo,
        email: 'test@example.com',
      });

      // Should not show validation error
      await user.tab();
      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      });
    });
  });

  describe('Conditional Validation', () => {
    it('should not require delivery address for pickup orders', async () => {
      const user = userEvent.setup();
      const onValidationChange = vi.fn();
      
      render(
        <CheckoutForm 
          {...defaultProps} 
          orderType="pickup"
          customerInfo={{
            name: 'John Doe',
            phone: '1234567890',
            email: 'john@example.com',
          }}
          onValidationChange={onValidationChange}
        />
      );

      // Should be valid without delivery address
      await waitFor(() => {
        expect(onValidationChange).toHaveBeenCalledWith(true);
      });
    });

    it('should require delivery address for delivery orders', async () => {
      const user = userEvent.setup();
      const onValidationChange = vi.fn();
      
      render(
        <CheckoutForm 
          {...defaultProps} 
          orderType="delivery"
          customerInfo={{
            name: 'John Doe',
            phone: '1234567890',
            email: 'john@example.com',
          }}
          onValidationChange={onValidationChange}
        />
      );

      // Should be invalid without delivery address
      await waitFor(() => {
        expect(onValidationChange).toHaveBeenCalledWith(false);
      });
    });

    it('should update validation when switching between pickup and delivery', async () => {
      const user = userEvent.setup();
      const onValidationChange = vi.fn();
      const onOrderTypeChange = vi.fn();
      
      render(
        <CheckoutForm 
          {...defaultProps} 
          orderType="delivery"
          customerInfo={{
            name: 'John Doe',
            phone: '1234567890',
            email: 'john@example.com',
          }}
          onValidationChange={onValidationChange}
          onOrderTypeChange={onOrderTypeChange}
        />
      );

      // Switch to pickup
      const pickupOption = screen.getByRole('radio', { name: /pickup/i });
      await user.click(pickupOption);

      expect(onOrderTypeChange).toHaveBeenCalledWith('pickup');
    });
  });

  describe('Real-time Validation', () => {
    it('should validate fields as user types', async () => {
      const user = userEvent.setup();
      const onValidationChange = vi.fn();
      
      render(<CheckoutForm {...defaultProps} onValidationChange={onValidationChange} />);

      const nameInput = screen.getByPlaceholderText('John Doe');
      
      // Start typing - should trigger validation
      await user.type(nameInput, 'J');
      
      // Should call validation change
      await waitFor(() => {
        expect(onValidationChange).toHaveBeenCalled();
      });
    });

    it('should clear validation errors when field becomes valid', async () => {
      const user = userEvent.setup();
      render(<CheckoutForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('john@example.com');
      
      // Enter invalid email
      await user.type(emailInput, 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      // Fix the email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for invalid fields', async () => {
      const user = userEvent.setup();
      render(<CheckoutForm {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('John Doe');
      await user.click(nameInput);
      await user.tab();

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
        expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
      });
    });

    it('should have proper ARIA attributes for valid fields', () => {
      render(<CheckoutForm {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('John Doe');
      expect(nameInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('should have proper error message roles', async () => {
      const user = userEvent.setup();
      render(<CheckoutForm {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('John Doe');
      await user.click(nameInput);
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText('Full name is required');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});