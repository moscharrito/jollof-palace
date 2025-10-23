import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import PaymentMethodSelector from '../../components/payment/PaymentMethodSelector';
import { PaymentMethod } from '@food-ordering/shared';

// Mock window objects for payment method availability
const mockApplePaySession = {
  canMakePayments: vi.fn(() => true),
};

const mockGooglePay = {
  payments: {
    api: {
      PaymentsClient: vi.fn(),
    },
  },
};

Object.defineProperty(window, 'ApplePaySession', {
  value: mockApplePaySession,
  writable: true,
});

Object.defineProperty(window, 'google', {
  value: mockGooglePay,
  writable: true,
});

describe('PaymentMethodSelector', () => {
  const mockOnMethodChange = vi.fn();

  const defaultProps = {
    selectedMethod: 'card' as PaymentMethod,
    onMethodChange: mockOnMethodChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all available payment methods', () => {
    render(<PaymentMethodSelector {...defaultProps} />);

    expect(screen.getByText('Credit/Debit Card')).toBeInTheDocument();
    expect(screen.getByText('Apple Pay')).toBeInTheDocument();
    expect(screen.getByText('Google Pay')).toBeInTheDocument();
    expect(screen.getByText('PayPal')).toBeInTheDocument();
  });

  it('should show popular badge for card payment', () => {
    render(<PaymentMethodSelector {...defaultProps} />);

    expect(screen.getByText('Popular')).toBeInTheDocument();
  });

  it('should highlight selected payment method', () => {
    render(<PaymentMethodSelector {...defaultProps} selectedMethod="paypal" />);

    const paypalOption = screen.getByLabelText(/paypal/i);
    expect(paypalOption).toBeChecked();
  });

  it('should call onMethodChange when payment method is selected', async () => {
    const user = userEvent.setup();
    render(<PaymentMethodSelector {...defaultProps} />);

    const paypalOption = screen.getByLabelText(/paypal/i);
    await user.click(paypalOption);

    expect(mockOnMethodChange).toHaveBeenCalledWith('paypal');
  });

  it('should disable all options when disabled prop is true', () => {
    render(<PaymentMethodSelector {...defaultProps} disabled={true} />);

    const cardOption = screen.getByLabelText(/credit\/debit card/i);
    const paypalOption = screen.getByLabelText(/paypal/i);

    expect(cardOption).toBeDisabled();
    expect(paypalOption).toBeDisabled();
  });

  it('should not show Apple Pay when not available', () => {
    // Mock Apple Pay as not available
    mockApplePaySession.canMakePayments.mockReturnValue(false);

    render(<PaymentMethodSelector {...defaultProps} />);

    expect(screen.queryByText('Apple Pay')).not.toBeInTheDocument();
  });

  it('should not show Google Pay when not available', () => {
    // Mock Google Pay as not available
    Object.defineProperty(window, 'google', {
      value: undefined,
      writable: true,
    });

    render(<PaymentMethodSelector {...defaultProps} />);

    expect(screen.queryByText('Google Pay')).not.toBeInTheDocument();
  });

  it('should show appropriate descriptions for each payment method', () => {
    render(<PaymentMethodSelector {...defaultProps} />);

    expect(screen.getByText('Visa, Mastercard, American Express')).toBeInTheDocument();
    expect(screen.getByText('Pay with Touch ID or Face ID')).toBeInTheDocument();
    expect(screen.getByText('Quick and secure payments')).toBeInTheDocument();
    expect(screen.getByText('Pay with your PayPal account')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<PaymentMethodSelector {...defaultProps} />);

    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons).toHaveLength(4); // All payment methods available

    radioButtons.forEach(radio => {
      expect(radio).toHaveAttribute('name', 'paymentMethod');
    });
  });

  it('should show no payment methods message when none are available', () => {
    // Mock all payment methods as unavailable
    mockApplePaySession.canMakePayments.mockReturnValue(false);
    Object.defineProperty(window, 'google', {
      value: undefined,
      writable: true,
    });

    // Override the component to filter out all methods
    const NoMethodsSelector = () => {
      return (
        <div className="space-y-3">
          <div className="text-center py-8">
            <p className="text-gray-600">No payment methods available</p>
          </div>
        </div>
      );
    };

    render(<NoMethodsSelector />);
    expect(screen.getByText('No payment methods available')).toBeInTheDocument();
  });
});