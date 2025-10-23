import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  
  useEffect(() => {
    // Clear cart after successful payment
    localStorage.removeItem('jollof-palace-cart');
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for your order! Your payment has been processed successfully 
          and your delicious meal is being prepared.
        </p>
        
        {/* Order Info */}
        {orderNumber && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600 mb-1">Order Number</div>
            <div className="font-semibold text-gray-900">{orderNumber}</div>
          </div>
        )}
        
        {/* Estimated Time */}
        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-red-600 mb-1">Estimated Ready Time</div>
          <div className="font-semibold text-red-800">30-45 minutes</div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          {orderId && (
            <Link
              to={`/order/${orderId}`}
              className="btn btn-primary w-full"
            >
              Track Your Order
            </Link>
          )}
          
          <Link
            to="/menu"
            className="btn btn-secondary w-full"
          >
            Continue Shopping
          </Link>
        </div>
        
        {/* Contact Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            Questions about your order?
          </p>
          <div className="space-y-1 text-sm text-gray-600">
            <div>📞 +1 (234) 567-890</div>
            <div>✉️ support@jollofpalace.com</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;