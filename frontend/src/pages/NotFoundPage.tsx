import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Illustration */}
        <div className="text-8xl mb-6">🍽️</div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-gray-600 mb-8">
          Oops! The page you're looking for seems to have gone missing. 
          Maybe it's in the kitchen getting prepared?
        </p>
        
        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="btn btn-primary btn-lg inline-flex items-center"
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          
          <div className="text-center">
            <Link
              to="/menu"
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Browse Our Menu
            </Link>
          </div>
        </div>
        
        {/* Help Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">
            Still can't find what you're looking for?
          </p>
          
          <div className="space-y-2 text-sm">
            <div>
              <a 
                href="tel:+1234567890" 
                className="text-red-600 hover:text-red-700"
              >
                📞 +1 (234) 567-890
              </a>
            </div>
            <div>
              <a 
                href="mailto:support@jollofpalace.com" 
                className="text-red-600 hover:text-red-700"
              >
                ✉️ support@jollofpalace.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;