import { PaymentMethod } from '../../types';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

const PaymentMethodSelector = ({
  selectedMethod,
  onMethodChange,
  disabled = false,
}: PaymentMethodSelectorProps) => {
  const paymentMethods = [
    {
      id: 'card' as PaymentMethod,
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, American Express',
      icon: '💳',
      popular: true,
    },
    {
      id: 'apple_pay' as PaymentMethod,
      name: 'Apple Pay',
      description: 'Pay with Touch ID or Face ID',
      icon: '🍎',
      popular: false,
    },
    {
      id: 'google_pay' as PaymentMethod,
      name: 'Google Pay',
      description: 'Quick and secure payments',
      icon: '🟢',
      popular: false,
    },
    {
      id: 'paypal' as PaymentMethod,
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      icon: '🅿️',
      popular: false,
    },
  ];

  // Check if Apple Pay is available
  const isApplePayAvailable = () => {
    return (
      window.ApplePaySession &&
      (window as any).ApplePaySession.canMakePayments()
    );
  };

  // Check if Google Pay is available
  const isGooglePayAvailable = () => {
    return window.google && window.google.payments;
  };

  const isMethodAvailable = (method: PaymentMethod) => {
    switch (method) {
      case 'apple_pay':
        return isApplePayAvailable();
      case 'google_pay':
        return isGooglePayAvailable();
      default:
        return true;
    }
  };

  const availableMethods = paymentMethods.filter(method => 
    isMethodAvailable(method.id)
  );

  return (
    <div className="space-y-3">
      {availableMethods.map((method) => (
        <label
          key={method.id}
          className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedMethod === method.id
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="radio"
            name="paymentMethod"
            value={method.id}
            checked={selectedMethod === method.id}
            onChange={(e) => onMethodChange(e.target.value as PaymentMethod)}
            disabled={disabled}
            className="sr-only"
          />
          
          <div className="flex items-center flex-1">
            <div className="text-2xl mr-4">{method.icon}</div>
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium text-gray-900">{method.name}</span>
                {method.popular && (
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    Popular
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{method.description}</p>
            </div>
          </div>
          
          {/* Radio button indicator */}
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            selectedMethod === method.id
              ? 'border-red-500 bg-red-500'
              : 'border-gray-300'
          }`}>
            {selectedMethod === method.id && (
              <div className="w-2 h-2 bg-white rounded-full"></div>
            )}
          </div>
        </label>
      ))}
      
      {availableMethods.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No payment methods available</p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;