import { useCart } from '../../hooks/useCart';

interface CartSummaryProps {
  showDeliveryFee?: boolean;
  deliveryFeeThreshold?: number;
  deliveryFee?: number;
  className?: string;
}

const CartSummary = ({ 
  showDeliveryFee = false, 
  deliveryFeeThreshold = 2500,
  deliveryFee = 500,
  className = '' 
}: CartSummaryProps) => {
  const { getSubtotal, getTax, getTotalItems } = useCart();
  
  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceInCents / 100);
  };
  
  const subtotal = getSubtotal();
  const tax = getTax();
  const actualDeliveryFee = showDeliveryFee && subtotal < deliveryFeeThreshold ? deliveryFee : 0;
  const total = subtotal + tax + actualDeliveryFee;
  
  if (getTotalItems() === 0) {
    return null;
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Order Summary
      </h3>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'})</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        
        <div className="flex justify-between text-gray-600">
          <span>Tax (8.75%)</span>
          <span>{formatPrice(tax)}</span>
        </div>
        
        {showDeliveryFee && (
          <div className="flex justify-between text-gray-600">
            <span>
              Delivery Fee
              {actualDeliveryFee === 0 && (
                <span className="text-green-600 text-sm ml-1">(Free!)</span>
              )}
            </span>
            <span>{formatPrice(actualDeliveryFee)}</span>
          </div>
        )}
        
        {showDeliveryFee && subtotal < deliveryFeeThreshold && (
          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
            Add {formatPrice(deliveryFeeThreshold - subtotal)} more for free delivery!
          </div>
        )}
        
        <div className="border-t pt-3">
          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;