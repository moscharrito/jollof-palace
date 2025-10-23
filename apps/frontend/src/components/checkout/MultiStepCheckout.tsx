import { useState } from 'react';
import { CustomerInfo } from '@food-ordering/shared';
import { CartItem } from '../../contexts/CartContext';
import CheckoutForm from './CheckoutForm';
import OrderReview from './OrderReview';

interface MultiStepCheckoutProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  onSubmitOrder: (orderData: {
    customerInfo: CustomerInfo;
    orderType: 'pickup' | 'delivery';
    specialInstructions: string;
    items: CartItem[];
    total: number;
  }) => Promise<void>;
  isLoading: boolean;
}

type CheckoutStep = 'form' | 'review';

const MultiStepCheckout = ({
  items,
  subtotal,
  tax,
  onSubmitOrder,
  isLoading,
}: MultiStepCheckoutProps) => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('form');
  const [isFormValid, setIsFormValid] = useState(false);
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
  });
  
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('delivery');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Calculate delivery fee
  const deliveryFee = orderType === 'delivery' && subtotal < 2500 ? 500 : 0;
  const total = subtotal + tax + deliveryFee;

  const handleContinueToReview = () => {
    if (isFormValid) {
      setCurrentStep('review');
    }
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
  };

  const handleSubmitOrder = async () => {
    await onSubmitOrder({
      customerInfo,
      orderType,
      specialInstructions,
      items,
      total,
    });
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'form':
        return 'Order Information';
      case 'review':
        return 'Review Your Order';
      default:
        return 'Checkout';
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'form' 
              ? 'bg-red-600 text-white' 
              : 'bg-green-600 text-white'
          }`}>
            {currentStep === 'form' ? '1' : '✓'}
          </div>
          <span className={`ml-2 text-sm font-medium ${
            currentStep === 'form' ? 'text-red-600' : 'text-green-600'
          }`}>
            Order Information
          </span>
        </div>
        
        <div className={`w-16 h-0.5 ${
          currentStep === 'review' ? 'bg-red-600' : 'bg-gray-300'
        }`} />
        
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'review' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-300 text-gray-600'
          }`}>
            2
          </div>
          <span className={`ml-2 text-sm font-medium ${
            currentStep === 'review' ? 'text-red-600' : 'text-gray-500'
          }`}>
            Review Order
          </span>
        </div>
      </div>

      {/* Step Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">{getStepTitle()}</h2>
        <p className="mt-2 text-gray-600">
          {currentStep === 'form' 
            ? 'Please provide your contact information and delivery preferences'
            : 'Please review your order details before proceeding to payment'
          }
        </p>
      </div>

      {/* Step Content */}
      {currentStep === 'form' && (
        <CheckoutForm
          customerInfo={customerInfo}
          orderType={orderType}
          specialInstructions={specialInstructions}
          onCustomerInfoChange={setCustomerInfo}
          onOrderTypeChange={setOrderType}
          onSpecialInstructionsChange={setSpecialInstructions}
          onValidationChange={setIsFormValid}
        />
      )}

      {currentStep === 'review' && (
        <OrderReview
          items={items}
          customerInfo={customerInfo}
          orderType={orderType}
          specialInstructions={specialInstructions}
          subtotal={subtotal}
          tax={tax}
          deliveryFee={deliveryFee}
          total={total}
        />
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        {currentStep === 'form' ? (
          <div /> // Empty div for spacing
        ) : (
          <button
            type="button"
            onClick={handleBackToForm}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            ← Back to Information
          </button>
        )}

        {currentStep === 'form' ? (
          <button
            type="button"
            onClick={handleContinueToReview}
            disabled={!isFormValid}
            className="btn btn-primary"
          >
            Continue to Review →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmitOrder}
            disabled={isLoading}
            className="btn btn-primary btn-lg"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              'Place Order & Pay'
            )}
          </button>
        )}
      </div>

      {/* Order Summary Sidebar for Form Step */}
      {currentStep === 'form' && (
        <div className="lg:hidden">
          <div className="card p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Items ({items.length}):</span>
                <span>{new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(subtotal / 100)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(tax / 100)}</span>
              </div>
              <div className="flex justify-between">
                <span>{orderType === 'delivery' ? 'Delivery:' : 'Pickup:'}</span>
                <span>{new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(deliveryFee / 100)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t">
                <span>Total:</span>
                <span>{new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(total / 100)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiStepCheckout;