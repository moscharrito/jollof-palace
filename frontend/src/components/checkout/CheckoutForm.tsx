import { useState } from 'react';
import { CustomerInfo, Address } from '@food-ordering/shared';
import { validateEmail, validatePhone, validateRequired, formatPhoneNumber } from '../../utils/validation';

interface CheckoutFormProps {
  customerInfo: CustomerInfo;
  orderType: 'pickup' | 'delivery';
  specialInstructions: string;
  onCustomerInfoChange: (info: CustomerInfo) => void;
  onOrderTypeChange: (type: 'pickup' | 'delivery') => void;
  onSpecialInstructionsChange: (instructions: string) => void;
  onValidationChange: (isValid: boolean) => void;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

const CheckoutForm = ({
  customerInfo,
  orderType,
  specialInstructions,
  onCustomerInfoChange,
  onOrderTypeChange,
  onSpecialInstructionsChange,
  onValidationChange,
}: CheckoutFormProps) => {
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'name':
        return validateRequired(value, 'Full name is required');
      case 'phone':
        return validatePhone(value);
      case 'email':
        return value ? validateEmail(value) : undefined;
      case 'street':
        return orderType === 'delivery' ? validateRequired(value, 'Street address is required') : undefined;
      case 'city':
        return orderType === 'delivery' ? validateRequired(value, 'City is required') : undefined;
      case 'state':
        return orderType === 'delivery' ? validateRequired(value, 'State is required') : undefined;
      case 'postalCode':
        return orderType === 'delivery' ? validateRequired(value, 'ZIP code is required') : undefined;
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate customer info
    newErrors.name = validateField('name', customerInfo.name);
    newErrors.phone = validateField('phone', customerInfo.phone);
    newErrors.email = validateField('email', customerInfo.email || '');

    // Validate delivery address if needed
    if (orderType === 'delivery' && customerInfo.deliveryAddress) {
      newErrors.street = validateField('street', customerInfo.deliveryAddress.street);
      newErrors.city = validateField('city', customerInfo.deliveryAddress.city);
      newErrors.state = validateField('state', customerInfo.deliveryAddress.state);
      newErrors.postalCode = validateField('postalCode', customerInfo.deliveryAddress.postalCode || '');
    } else if (orderType === 'delivery') {
      newErrors.street = 'Street address is required';
      newErrors.city = 'City is required';
      newErrors.state = 'State is required';
      newErrors.postalCode = 'ZIP code is required';
    }

    setErrors(newErrors);
    
    const isValid = Object.values(newErrors).every(error => !error);
    onValidationChange(isValid);
    return isValid;
  };

  const handleFieldChange = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Update the customer info first
    let updatedCustomerInfo = customerInfo;
    if (field === 'name' || field === 'phone' || field === 'email') {
      // Format phone number as user types
      const processedValue = field === 'phone' ? value.replace(/\D/g, '') : value;
      updatedCustomerInfo = {
        ...customerInfo,
        [field]: processedValue,
      };
      onCustomerInfoChange(updatedCustomerInfo);
    } else if (['street', 'city', 'state', 'postalCode', 'landmark'].includes(field)) {
      const deliveryAddress: Address = {
        street: customerInfo.deliveryAddress?.street || '',
        city: customerInfo.deliveryAddress?.city || '',
        state: customerInfo.deliveryAddress?.state || '',
        postalCode: customerInfo.deliveryAddress?.postalCode || '',
        landmark: customerInfo.deliveryAddress?.landmark || '',
        ...customerInfo.deliveryAddress,
        [field]: value,
      };
      
      updatedCustomerInfo = {
        ...customerInfo,
        deliveryAddress,
      };
      onCustomerInfoChange(updatedCustomerInfo);
    }

    // Validate the field with the new value
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
    
    // Re-validate entire form with updated info
    setTimeout(() => {
      validateForm();
    }, 0);
  };

  const handleOrderTypeChange = (type: 'pickup' | 'delivery') => {
    onOrderTypeChange(type);
    
    // Clear delivery address errors when switching to pickup
    if (type === 'pickup') {
      setErrors(prev => ({
        ...prev,
        street: undefined,
        city: undefined,
        state: undefined,
        postalCode: undefined,
      }));
    }
    
    // Re-validate form
    setTimeout(validateForm, 0);
  };

  // Get validation summary for better UX
  const getValidationSummary = () => {
    const allErrors = Object.values(errors).filter(Boolean);
    if (allErrors.length === 0) return null;
    
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
        <h3 className="text-sm font-medium text-red-800 mb-2">
          Please fix the following errors:
        </h3>
        <ul className="text-sm text-red-700 space-y-1">
          {errors.name && <li>• {errors.name}</li>}
          {errors.phone && <li>• {errors.phone}</li>}
          {errors.email && <li>• {errors.email}</li>}
          {errors.street && <li>• {errors.street}</li>}
          {errors.city && <li>• {errors.city}</li>}
          {errors.state && <li>• {errors.state}</li>}
          {errors.postalCode && <li>• {errors.postalCode}</li>}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      {Object.keys(touched).length > 0 && getValidationSummary()}
      {/* Order Type */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Order Type
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="relative">
            <input
              type="radio"
              name="orderType"
              value="delivery"
              checked={orderType === 'delivery'}
              onChange={(e) => handleOrderTypeChange(e.target.value as 'delivery')}
              className="sr-only"
            />
            <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              orderType === 'delivery'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <div className="text-center">
                <div className="text-2xl mb-2">🚚</div>
                <div className="font-medium">Delivery</div>
                <div className="text-sm text-gray-600">30-45 min</div>
              </div>
            </div>
          </label>
          
          <label className="relative">
            <input
              type="radio"
              name="orderType"
              value="pickup"
              checked={orderType === 'pickup'}
              onChange={(e) => handleOrderTypeChange(e.target.value as 'pickup')}
              className="sr-only"
            />
            <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              orderType === 'pickup'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <div className="text-center">
                <div className="text-2xl mb-2">🏪</div>
                <div className="font-medium">Pickup</div>
                <div className="text-sm text-gray-600">15-20 min</div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Customer Information */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={customerInfo.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={() => {
                setTouched(prev => ({ ...prev, name: true }));
                const error = validateField('name', customerInfo.name);
                setErrors(prev => ({ ...prev, name: error }));
                setTimeout(validateForm, 0);
              }}
              className={`input w-full ${
                touched.name && errors.name ? 'border-red-500 focus:border-red-500' : ''
              }`}
              placeholder="John Doe"
              aria-invalid={touched.name && errors.name ? 'true' : 'false'}
              aria-describedby={touched.name && errors.name ? 'name-error' : undefined}
            />
            {touched.name && errors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.name}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formatPhoneNumber(customerInfo.phone)}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              onBlur={() => {
                setTouched(prev => ({ ...prev, phone: true }));
                const error = validateField('phone', customerInfo.phone);
                setErrors(prev => ({ ...prev, phone: error }));
                setTimeout(validateForm, 0);
              }}
              className={`input w-full ${
                touched.phone && errors.phone ? 'border-red-500 focus:border-red-500' : ''
              }`}
              placeholder="+1 (234) 567-8900"
              aria-invalid={touched.phone && errors.phone ? 'true' : 'false'}
              aria-describedby={touched.phone && errors.phone ? 'phone-error' : 'phone-help'}
            />
            {touched.phone && errors.phone ? (
              <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.phone}
              </p>
            ) : (
              <p id="phone-help" className="mt-1 text-sm text-gray-500">
                Enter your phone number for order updates
              </p>
            )}
          </div>
          
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={customerInfo.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              onBlur={() => {
                setTouched(prev => ({ ...prev, email: true }));
                const error = validateField('email', customerInfo.email || '');
                setErrors(prev => ({ ...prev, email: error }));
                setTimeout(validateForm, 0);
              }}
              className={`input w-full ${
                touched.email && errors.email ? 'border-red-500 focus:border-red-500' : ''
              }`}
              placeholder="john@example.com"
              aria-invalid={touched.email && errors.email ? 'true' : 'false'}
              aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
            />
            {touched.email && errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      {orderType === 'delivery' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Delivery Address
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                value={customerInfo.deliveryAddress?.street || ''}
                onChange={(e) => handleFieldChange('street', e.target.value)}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, street: true }));
                  const error = validateField('street', customerInfo.deliveryAddress?.street || '');
                  setErrors(prev => ({ ...prev, street: error }));
                  setTimeout(validateForm, 0);
                }}
                className={`input w-full ${
                  touched.street && errors.street ? 'border-red-500 focus:border-red-500' : ''
                }`}
                placeholder="123 Main Street, Apt 4B"
                aria-invalid={touched.street && errors.street ? 'true' : 'false'}
                aria-describedby={touched.street && errors.street ? 'street-error' : undefined}
              />
              {touched.street && errors.street && (
                <p id="street-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.street}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={customerInfo.deliveryAddress?.city || ''}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, city: true }));
                    const error = validateField('city', customerInfo.deliveryAddress?.city || '');
                    setErrors(prev => ({ ...prev, city: error }));
                    setTimeout(validateForm, 0);
                  }}
                  className={`input w-full ${
                    touched.city && errors.city ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="New York"
                  aria-invalid={touched.city && errors.city ? 'true' : 'false'}
                  aria-describedby={touched.city && errors.city ? 'city-error' : undefined}
                />
                {touched.city && errors.city && (
                  <p id="city-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.city}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={customerInfo.deliveryAddress?.state || ''}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, state: true }));
                    const error = validateField('state', customerInfo.deliveryAddress?.state || '');
                    setErrors(prev => ({ ...prev, state: error }));
                    setTimeout(validateForm, 0);
                  }}
                  className={`input w-full ${
                    touched.state && errors.state ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="NY"
                  aria-invalid={touched.state && errors.state ? 'true' : 'false'}
                  aria-describedby={touched.state && errors.state ? 'state-error' : undefined}
                />
                {touched.state && errors.state && (
                  <p id="state-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.state}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  value={customerInfo.deliveryAddress?.postalCode || ''}
                  onChange={(e) => handleFieldChange('postalCode', e.target.value.toUpperCase())}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, postalCode: true }));
                    const error = validateField('postalCode', customerInfo.deliveryAddress?.postalCode || '');
                    setErrors(prev => ({ ...prev, postalCode: error }));
                    setTimeout(validateForm, 0);
                  }}
                  className={`input w-full ${
                    touched.postalCode && errors.postalCode ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="10001"
                  maxLength={10}
                  aria-invalid={touched.postalCode && errors.postalCode ? 'true' : 'false'}
                  aria-describedby={touched.postalCode && errors.postalCode ? 'postal-error' : 'postal-help'}
                />
                {touched.postalCode && errors.postalCode ? (
                  <p id="postal-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.postalCode}
                  </p>
                ) : (
                  <p id="postal-help" className="mt-1 text-sm text-gray-500">
                    ZIP code, postal code, or area code
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={customerInfo.deliveryAddress?.landmark || ''}
                onChange={(e) => handleFieldChange('landmark', e.target.value)}
                className="input w-full"
                placeholder="Near Central Park"
              />
            </div>
          </div>
        </div>
      )}

      {/* Special Instructions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Special Instructions
        </h3>
        <textarea
          value={specialInstructions}
          onChange={(e) => onSpecialInstructionsChange(e.target.value)}
          className="input w-full h-24 resize-none"
          placeholder="Any special requests or dietary requirements..."
          maxLength={500}
        />
        <p className="mt-1 text-sm text-gray-500">
          {specialInstructions.length}/500 characters
        </p>
      </div>
    </div>
  );
};

export default CheckoutForm;