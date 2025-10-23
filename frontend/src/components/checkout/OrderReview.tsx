import { CustomerInfo } from '../../types';
import { CartItem } from '../../contexts/CartContext';

interface OrderReviewProps {
  items: CartItem[];
  customerInfo: CustomerInfo;
  orderType: 'pickup' | 'delivery';
  specialInstructions: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
}

const OrderReview = ({
  items,
  customerInfo,
  orderType,
  specialInstructions,
  subtotal,
  tax,
  deliveryFee,
  total,
}: OrderReviewProps) => {
  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceInCents / 100);
  };

  const formatPhoneForDisplay = (phone: string) => {
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      {/* Order Items */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Order Items ({items.length} {items.length === 1 ? 'item' : 'items'})
        </h3>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-4 py-3 border-b border-gray-200 last:border-b-0">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-600">
                  Quantity: {item.quantity}
                </p>
                {item.customizations && item.customizations.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Customizations: {item.customizations.join(', ')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatPrice(item.price * item.quantity)}
                </p>
                <p className="text-sm text-gray-600">
                  {formatPrice(item.price)} each
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Information */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Customer Information
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium text-gray-900">{customerInfo.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phone:</span>
            <span className="font-medium text-gray-900">{formatPhoneForDisplay(customerInfo.phone)}</span>
          </div>
          {customerInfo.email && (
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{customerInfo.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Order Type & Address */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {orderType === 'delivery' ? 'Delivery Information' : 'Pickup Information'}
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Order Type:</span>
            <span className="font-medium text-gray-900 capitalize">
              {orderType} {orderType === 'delivery' ? '🚚' : '🏪'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Estimated Time:</span>
            <span className="font-medium text-gray-900">
              {orderType === 'delivery' ? '30-45 minutes' : '15-20 minutes'}
            </span>
          </div>
          
          {orderType === 'delivery' && customerInfo.deliveryAddress && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Delivery Address:</p>
              <div className="text-sm text-gray-900 space-y-1">
                <p>{customerInfo.deliveryAddress.street}</p>
                <p>
                  {customerInfo.deliveryAddress.city}, {customerInfo.deliveryAddress.state}{' '}
                  {customerInfo.deliveryAddress.postalCode}
                </p>
                {customerInfo.deliveryAddress.landmark && (
                  <p className="text-gray-600">Landmark: {customerInfo.deliveryAddress.landmark}</p>
                )}
              </div>
            </div>
          )}
          
          {orderType === 'pickup' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Pickup Location:</p>
              <div className="text-sm text-gray-900">
                <p>Jollof Palace Restaurant</p>
                <p>123 Food Street, Lagos, Nigeria</p>
                <p className="text-gray-600">Please bring your order confirmation</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Special Instructions */}
      {specialInstructions && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Special Instructions
          </h3>
          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
            {specialInstructions}
          </p>
        </div>
      )}

      {/* Order Total */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Order Total
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          
          <div className="flex justify-between text-gray-600">
            <span>Tax (8.75%):</span>
            <span>{formatPrice(tax)}</span>
          </div>
          
          <div className="flex justify-between text-gray-600">
            <span>
              {orderType === 'delivery' ? 'Delivery Fee' : 'Pickup'}:
              {deliveryFee === 0 && orderType === 'delivery' && (
                <span className="text-green-600 text-sm ml-1">(Free!)</span>
              )}
            </span>
            <span>{formatPrice(deliveryFee)}</span>
          </div>
          
          <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total:</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Payment:</strong> You will be redirected to our secure payment processor to complete your order.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderReview;