import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { Order, PaymentMethod } from '../types';
import PaymentMethodSelector from '../components/payment/PaymentMethodSelector';
import StripePaymentForm from '../components/payment/StripePaymentForm';
import PayPalPaymentButton from '../components/payment/PayPalPaymentButton';
import ApplePayButton from '../components/payment/ApplePayButton';
import GooglePayButton from '../components/payment/GooglePayButton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../services/api';

const PaymentPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(location.state?.order || null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
  const [isLoading, setIsLoading] = useState(!order);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch order details if not provided in state
  useEffect(() => {
    if (!order && orderId) {
      fetchOrderDetails();
    }
  }, [orderId, order]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.data);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      setError('Failed to load order details. Please try again.');
      toast.error('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (transactionId: string, paymentReference: string) => {
    // Clear any error state
    setError(null);
    
    // Show success message
    toast.success('Payment processed successfully!');
    
    // Redirect to success page with order details
    navigate(`/payment/success?orderId=${orderId}&orderNumber=${order?.orderNumber}&transactionId=${transactionId}&reference=${paymentReference}`);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setIsProcessing(false);
    toast.error(errorMessage);
  };

  const handlePaymentCancel = () => {
    navigate('/payment/cancel');
  };

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceInCents / 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Error
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Order not found. Please check your order details and try again.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary w-full"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/menu')}
              className="btn btn-secondary w-full"
            >
              Return to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if order is already paid or not in payable state
  if (order.status !== 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">ℹ️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Already Processed
          </h2>
          <p className="text-gray-600 mb-6">
            This order has already been processed and cannot be paid for again.
          </p>
          <button
            onClick={() => navigate(`/order/${orderId}`)}
            className="btn btn-primary w-full"
          >
            View Order Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-red-600 hover:text-red-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
          <p className="text-gray-600 mt-2">
            Secure payment for Order #{order.orderNumber}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Selection */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Choose Payment Method
              </h2>
              <PaymentMethodSelector
                selectedMethod={selectedPaymentMethod}
                onMethodChange={setSelectedPaymentMethod}
                disabled={isProcessing}
              />
            </div>

            {/* Payment Form */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Payment Details
              </h2>
              
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {selectedPaymentMethod === PaymentMethod.CARD && (
                <StripePaymentForm
                  order={order}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onProcessingChange={setIsProcessing}
                  disabled={isProcessing}
                />
              )}

              {selectedPaymentMethod === 'paypal' && (
                <PayPalPaymentButton
                  order={order}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                  disabled={isProcessing}
                />
              )}

              {selectedPaymentMethod === 'apple_pay' && (
                <ApplePayButton
                  order={order}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  disabled={isProcessing}
                />
              )}

              {selectedPaymentMethod === 'google_pay' && (
                <GooglePayButton
                  order={order}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  disabled={isProcessing}
                />
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium">{order.items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order Type:</span>
                  <span className="font-medium capitalize">{order.orderType}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
                {order.orderType === 'delivery' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery:</span>
                    <span>{formatPrice(order.total - order.subtotal - order.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <div className="text-blue-600 mr-3">🔒</div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Secure Payment
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Your payment information is encrypted and secure. We never store your card details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;