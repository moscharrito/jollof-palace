import { useState, useEffect } from 'react';
import { Order } from '@food-ordering/shared';
import api from '../../services/api';

interface ApplePayButtonProps {
  order: Order;
  onSuccess: (transactionId: string, paymentReference: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    ApplePaySession?: any;
  }
}

const ApplePayButton = ({
  order,
  onSuccess,
  onError,
  disabled = false,
}: ApplePayButtonProps) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    checkApplePayAvailability();
  }, []);

  const checkApplePayAvailability = () => {
    if (window.ApplePaySession) {
      const canMakePayments = ApplePaySession.canMakePayments();
      setIsAvailable(canMakePayments);
    }
  };

  const handleApplePayClick = async () => {
    if (!window.ApplePaySession || disabled || isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment request
      const paymentRequest = {
        countryCode: 'US',
        currencyCode: 'USD',
        supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
        merchantCapabilities: ['supports3DS'],
        total: {
          label: `Jollof Palace - Order #${order.orderNumber}`,
          amount: (order.total / 100).toFixed(2),
        },
        lineItems: order.items.map(item => ({
          label: `${item.menuItem.name} (x${item.quantity})`,
          amount: (item.subtotal / 100).toFixed(2),
        })),
      };

      // Add tax and delivery fee as line items
      if (order.tax > 0) {
        paymentRequest.lineItems.push({
          label: 'Tax',
          amount: (order.tax / 100).toFixed(2),
        });
      }

      const deliveryFee = order.total - order.subtotal - order.tax;
      if (deliveryFee > 0) {
        paymentRequest.lineItems.push({
          label: 'Delivery Fee',
          amount: (deliveryFee / 100).toFixed(2),
        });
      }

      const session = new ApplePaySession(3, paymentRequest);

      session.onvalidatemerchant = async (event: any) => {
        try {
          const response = await api.post('/payments/apple-pay/validate-merchant', {
            validationURL: event.validationURL,
            displayName: 'Jollof Palace',
          });
          session.completeMerchantValidation(response.data.data);
        } catch (error) {
          console.error('Apple Pay merchant validation failed:', error);
          session.abort();
          onError('Apple Pay validation failed. Please try another payment method.');
        }
      };

      session.onpaymentauthorized = async (event: any) => {
        try {
          const response = await api.post('/payments/apple-pay/process-payment', {
            orderId: order.id,
            paymentData: event.payment,
            amount: order.total,
          });

          const result = response.data.data;
          
          if (result.success) {
            session.completePayment(ApplePaySession.STATUS_SUCCESS);
            onSuccess(result.transactionId, result.reference);
          } else {
            session.completePayment(ApplePaySession.STATUS_FAILURE);
            onError(result.message || 'Apple Pay payment failed');
          }
        } catch (error: any) {
          console.error('Apple Pay payment processing failed:', error);
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          onError('Apple Pay payment processing failed. Please try again.');
        }
      };

      session.oncancel = () => {
        setIsProcessing(false);
      };

      session.begin();
    } catch (error: any) {
      console.error('Apple Pay error:', error);
      setIsProcessing(false);
      onError('Failed to start Apple Pay. Please try another payment method.');
    }
  };

  if (!isAvailable) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">🍎</div>
        <p className="text-gray-600 mb-2">Apple Pay not available</p>
        <p className="text-sm text-gray-500">
          Apple Pay is not supported on this device or browser.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Apple Pay Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-gray-600 mr-3">🍎</div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Pay with Apple Pay
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Use Touch ID, Face ID, or your device passcode to pay securely.
            </p>
          </div>
        </div>
      </div>

      {/* Apple Pay Button */}
      <button
        onClick={handleApplePayClick}
        disabled={disabled || isProcessing}
        className={`w-full h-12 bg-black text-white rounded-lg font-medium transition-all ${
          disabled || isProcessing
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-800 active:bg-gray-900'
        }`}
        style={{
          background: 'linear-gradient(135deg, #000 0%, #333 100%)',
        }}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Processing...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className="mr-2">🍎</span>
            Pay with Apple Pay
          </div>
        )}
      </button>

      {/* Order Total */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Amount:</span>
          <span className="text-lg font-semibold text-gray-900">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(order.total / 100)}
          </span>
        </div>
      </div>

      {/* Security Notice */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          🔒 Secured by Apple's industry-leading security
        </p>
      </div>
    </div>
  );
};

export default ApplePayButton;