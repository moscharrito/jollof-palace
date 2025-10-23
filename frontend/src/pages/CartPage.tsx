import { Link } from 'react-router-dom';
import { ShoppingCartIcon } from '@heroicons/react/24/solid';

import { useCart } from '../hooks/useCart';
import CartSummary from '../components/cart/CartSummary';
import CartItem from '../components/cart/CartItem';

const CartPage = () => {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    getTotalItems 
  } = useCart();
  
  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceInCents / 100);
  };
  
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShoppingCartIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any delicious items to your cart yet.
          </p>
          <Link
            to="/menu"
            className="btn btn-primary btn-lg"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Cart
          </h1>
          <p className="text-gray-600">
            {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
                formatPrice={formatPrice}
              />
            ))}
            
            {/* Clear Cart Button */}
            <div className="flex justify-end">
              <button
                onClick={clearCart}
                className="btn btn-ghost text-red-600 hover:bg-red-50"
              >
                Clear Cart
              </button>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CartSummary 
                showDeliveryFee={true}
                deliveryFeeThreshold={2500}
                deliveryFee={500}
                className="mb-4"
              />
              
              <div className="space-y-3">
                <Link
                  to="/checkout"
                  className="btn btn-primary w-full btn-lg"
                >
                  Proceed to Checkout
                </Link>
                
                <Link
                  to="/menu"
                  className="btn btn-ghost w-full mt-3"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;