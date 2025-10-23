import { useState, useEffect, useRef } from 'react';
import { Order } from '../../types';
import api from '../../services/api';

interface GooglePayButtonProps {
  order: Order;
  onSuccess: (transactionId: string, paymentReference: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    google?: any;
  }
}

const GooglePayButton = ({
  order,
  onSuccess,
  onError,
  disabled = false,
}: GooglePayButtonProps) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentsClient, setPaymentsClient] = useState<any>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGooglePayScript();
  }, []);

  const loadGooglePayScript = () => {
    if (window.google && window.google.payments) {
      initializeGooglePay();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://pay.google.com/gp/p/js/pay.js';
    script.async = true;
    script.onload = () => {
      initializeGooglePay();
    };
    script.onerror = () => {
      onError('Failed to load Google Pay. Please try another payment method.');
    };
    document.head.appendChild(script);
  };

  const initializeGooglePay = () => {
    if (!window.google || !window.google.payments) {
      return;
    }

    const client = new (window as any).google.payments.api.PaymentsClient({
      environment: import.meta.env.VITE_GOOGLE_PAY_ENVIRONMENT || 'TEST',
    });

    setPaymentsClient(client);

    // Check if Google Pay is available
    const isReadyToPayRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['MASTERCARD', 'VISA', 'AMEX'],
          },
        },
      ],
    };

    client
      .isReadyToPay(isReadyToPayRequest)
      .then((response: any) => {
        if (response.result) {
          setIsAvailable(true);
          renderGooglePayButton(client);
        }
      })
      .catch((err: any) => {
        console.error('Google Pay availability check failed:', err);
      });
  };

  const renderGooglePayButton = (client: any) => {
    if (!buttonRef.current) return;

    const button = client.createButton({
      onClick: handleGooglePayClick,
      buttonColor: 'black',
      buttonType: 'pay',
      buttonSizeMode: 'fill',
    });

    buttonRef.current.appendChild(button);
  };

  const handleGooglePayClick = async () => {
    if (!paymentsClient || disabled || isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['MASTERCARD', 'VISA', 'AMEX'],
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: {
                gateway: 'stripe',
                'stripe:version': '2020-08-27',
                'stripe:publishableKey': import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
              },
            },
          },
        ],
        merchantInfo: {
          merchantId: import.meta.env.VITE_GOOGLE_PAY_MERCHANT_ID || '',
          merchantName: 'Jollof Palace',
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: (order.total / 100).toFixed(2),
          currencyCode: 'USD',
          displayItems: [
            ...order.items.map(item => ({
              label: `${item.menuItem?.name || 'Item'} (x${item.quantity})`,
              type: 'LINE_ITEM',
              price: (item.subtotal / 100).toFixed(2),
            })),
            ...(order.tax > 0 ? [{
              label: 'Tax',
              type: 'TAX',
              price: (order.tax / 100).toFixed(2),
            }] : []),
            ...(order.total - order.subtotal - order.tax > 0 ? [{
              label: 'Delivery Fee',
              type: 'LINE_ITEM',
              price: ((order.total - order.subtotal - order.tax) / 100).toFixed(2),
            }] : []),
          ],
        },
      };

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
      
      // Process payment with backend
      const response = await api.post('/payments/google-pay/process-payment', {
        orderId: order.id,
        paymentData: paymentData,
        amount: order.total,
      });

      const result = response.data.data;
      
      if (result.success) {
        onSuccess(result.transactionId, result.reference);
      } else {
        onError(result.message || 'Google Pay payment failed');
      }
    } catch (error: any) {
      console.error('Google Pay error:', error);
      
      if (error.statusCode === 'CANCELED') {
        // User cancelled - don't show error
        setIsProcessing(false);
        return;
      }
      
      onError('Google Pay payment failed. Please try another payment method.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAvailable) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">🟢</div>
        <p className="text-gray-600 mb-2">Google Pay not available</p>
        <p className="text-sm text-gray-500">
          Google Pay is not supported on this device or browser.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Google Pay Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-blue-600 mr-3">🟢</div>
          <div>
            <p className="text-sm font-medium text-blue-900">
              Pay with Google Pay
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Quick and secure payments with your saved cards.
            </p>
          </div>
        </div>
      </div>

      {/* Google Pay Button Container */}
      <div className={`${disabled || isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
        <div ref={buttonRef} className="w-full h-12" />
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Processing payment...</span>
        </div>
      )}

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
          🔒 Secured by Google's advanced security technology
        </p>
      </div>
    </div>
  );
};

export default GooglePayButton;