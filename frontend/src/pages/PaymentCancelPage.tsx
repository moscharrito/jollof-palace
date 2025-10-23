import { Link } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/solid';

const PaymentCancelPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        {/* Cancel Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircleIcon className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        {/* Cancel Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Cancelled
        </h1>
        
        <p className="text-gray-600 mb-8">
          Your payment was cancelled and no charges were made to your account. 
          Your cart items are still saved if you'd like to try again.
        </p>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            to="/cart"
            className="btn btn-primary w-full"
          >
            Return to Cart
          </Link>
          
          <Link
            to="/menu"
            className="btn btn-secondary w-full"
          >
            Continue Shopping
          </Link>
        </div>
        
        {/* Help Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">
            Having trouble with payment? We're here to help!
          </p>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div>📞 +1 (234) 567-890</div>
            <div>✉️ support@jollofpalace.com</div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Payment Methods Accepted:</strong><br />
              Credit/Debit Cards, Apple Pay, Google Pay, PayPal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;