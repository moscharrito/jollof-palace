import { useEffect, useRef, useState } from 'react';
import { Order } from '../../types';
import api from '../../services/api';

interface PayPalPaymentButtonProps {
  order: Order;
  onSuccess: (transactionId: string, paymentReference: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

const PayPalPaymentButton = ({
  order,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
}: PayPalPaymentButtonProps) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load PayPal SDK
    if (!window.paypal) {
      loadPayPalScript();
    } else {
      setScriptLoaded(true);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (scriptLoaded && paypalRef.current && !disabled) {
      renderPayPalButton();
    }
  }, [scriptLoaded, disabled]);

  const loadPayPalScript = () => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${
      import.meta.env.VITE_PAYPAL_CLIENT_ID
    }&currency=USD&intent=capture`;
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
      setIsLoading(false);
    };
    script.onerror = () => {
      setIsLoading(false);
      onError('Failed to load PayPal. Please try again or use a different payment method.');
    };
    document.body.appendChild(script);
  };

  const renderPayPalButton = () => {
    if (!paypalRef.current || !window.paypal) return;

    // Clear any existing buttons
    paypalRef.current.innerHTML = '';

    window.paypal
      .Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
          height: 50,
        },
        createOrder: async () => {
          try {
            const response = await api.post('/payments/paypal/create-order', {
              orderId: order.id,
              amount: order.total,
              currency: 'USD',
            });
            return response.data.data.orderId;
          } catch (error: any) {
            console.error('Error creating PayPal order:', error);
            onError('Failed to initialize PayPal payment. Please try again.');
            throw error;
          }
        },
        onApprove: async (data: any) => {
          try {
            const response = await api.post('/payments/paypal/capture-order', {
              orderId: data.orderID,
              paymentOrderId: order.id,
            });
            
            const captureData = response.data.data;
            onSuccess(captureData.transactionId, captureData.reference);
          } catch (error: any) {
            console.error('Error capturing PayPal payment:', error);
            onError('Payment capture failed. Please contact support.');
          }
        },
        onCancel: () => {
          onCancel();
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          onError('PayPal payment failed. Please try again or use a different payment method.');
        },
      })
      .render(paypalRef.current);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading PayPal...</span>
      </div>
    );
  }

  if (!scriptLoaded) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">Failed to load PayPal</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-secondary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PayPal Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-blue-600 mr-3">🅿️</div>
          <div>
            <p className="text-sm font-medium text-blue-900">
              Pay with PayPal
            </p>
            <p className="text-xs text-blue-700 mt-1">
              You'll be redirected to PayPal to complete your payment securely.
            </p>
          </div>
        </div>
      </div>

      {/* PayPal Button Container */}
      <div 
        ref={paypalRef} 
        className={disabled ? 'opacity-50 pointer-events-none' : ''}
      />

      {/* Order Summary */}
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
          🔒 Secured by PayPal's industry-leading encryption
        </p>
      </div>
    </div>
  );
};

export default PayPalPaymentButton;