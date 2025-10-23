import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Order } from '@food-ordering/shared';

import api from '../../services/api';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentFormProps {
  order: Order;
  onSuccess: (transactionId: string, paymentReference: string) => void;
  onError: (error: string) => void;
  onProcessingChange: (isProcessing: boolean) => void;
  disabled?: boolean;
}

const CardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

const PaymentForm = ({
  order,
  onSuccess,
  onError,
  onProcessingChange,
  disabled,
}: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  // Create payment intent when component mounts
  useEffect(() => {
    createPaymentIntent();
  }, [order.id]);

  const createPaymentIntent = async () => {
    try {
      const response = await api.post('/payments/stripe/create-intent', {
        orderId: order.id,
        amount: order.total,
        currency: 'usd',
        method: 'card',
      });

      setClientSecret(response.data.data.clientSecret);
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      onError('Failed to initialize payment. Please try again.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setIsProcessing(true);
    onProcessingChange(true);
    setCardError(null);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: order.customerInfo.name,
            email: order.customerInfo.email || undefined,
            phone: order.customerInfo.phone,
          },
        },
      });

      if (error) {
        console.error('Payment failed:', error);
        setCardError(error.message || 'Payment failed');
        onError(error.message || 'Payment failed. Please try again.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        onSuccess(paymentIntent.id, paymentIntent.client_secret || '');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      onError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
      onProcessingChange(false);
    }
  };

  const handleCardChange = (event: any) => {
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Initializing payment...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="p-4 border border-gray-300 rounded-lg bg-white">
          <CardElement
            options={CardElementOptions}
            onChange={handleCardChange}
          />
        </div>
        {cardError && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {cardError}
          </p>
        )}
      </div>

      {/* Billing Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cardholder Name
          </label>
          <input
            type="text"
            value={order.customerInfo.name}
            readOnly
            className="input w-full bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={order.customerInfo.email || ''}
            readOnly
            className="input w-full bg-gray-50"
            placeholder="Not provided"
          />
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-green-600 mr-3">🔒</div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Your payment is secure
            </p>
            <p className="text-xs text-gray-600 mt-1">
              We use industry-standard encryption to protect your card information. 
              Your card details are never stored on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing || disabled}
        className={`btn btn-primary w-full btn-lg ${
          isProcessing ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Processing Payment...
          </div>
        ) : (
          `Pay ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(order.total / 100)}`
        )}
      </button>

      {/* Payment Methods Accepted */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-2">We accept</p>
        <div className="flex justify-center space-x-4 text-2xl">
          <span>💳</span>
          <span>🏧</span>
          <span>💰</span>
        </div>
      </div>
    </form>
  );
};

const StripePaymentForm = (props: StripePaymentFormProps) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripePaymentForm;