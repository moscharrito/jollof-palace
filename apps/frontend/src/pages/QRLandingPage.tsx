import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QrCodeIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAvailableMenuItems } from '../hooks/useMenu';

const QRLandingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: menuItems, isLoading, error } = useAvailableMenuItems();

  // Get table number or location from QR code parameters
  const tableNumber = searchParams.get('table');
  const location = searchParams.get('location');

  useEffect(() => {
    // Store QR code context in session storage for later use
    if (tableNumber) {
      sessionStorage.setItem('tableNumber', tableNumber);
    }
    if (location) {
      sessionStorage.setItem('location', location);
    }
  }, [tableNumber, location]);

  const handleViewMenu = () => {
    navigate('/menu');
  };

  const handleDirectOrder = () => {
    navigate('/menu?quickOrder=true');
  };

  // Check if restaurant is open (mock logic - should come from backend)
  const isRestaurantOpen = () => {
    const now = new Date();
    const hour = now.getHours();
    // Assume restaurant is open from 10 AM to 10 PM
    return hour >= 10 && hour < 22;
  };

  const getNextOpenTime = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < 10) {
      return '10:00 AM today';
    } else {
      return '10:00 AM tomorrow';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Unable to Load Menu
          </h2>
          <p className="text-gray-600 mb-6">
            We're having trouble connecting to our menu system. Please try again in a moment.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!isRestaurantOpen()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🕒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            We're Currently Closed
          </h2>
          <p className="text-gray-600 mb-4">
            Thanks for your interest! We'll be open again at {getNextOpenTime()}.
          </p>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Operating Hours</h3>
            <p className="text-sm text-gray-600">
              Monday - Sunday: 10:00 AM - 10:00 PM
            </p>
          </div>
          <button
            onClick={handleViewMenu}
            className="btn btn-outline w-full"
          >
            View Menu (Ordering Unavailable)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <QrCodeIcon className="w-8 h-8 text-red-600 mr-2" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome to Jollof Palace
              </h1>
            </div>
            {tableNumber && (
              <div className="flex items-center justify-center text-gray-600">
                <MapPinIcon className="w-4 h-4 mr-1" />
                <span className="text-sm">Table {tableNumber}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
            Authentic Nigerian Cuisine
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience the rich flavors of Nigeria with our signature Jollof rice and pepper-based dishes, 
            made with fresh ingredients and traditional recipes.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {menuItems?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Menu Items Available</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
            <div className="flex items-center justify-center mb-1">
              <ClockIcon className="w-5 h-5 text-green-600 mr-1" />
              <span className="text-2xl font-bold text-green-600">15-25</span>
            </div>
            <div className="text-sm text-gray-600">Minutes Prep Time</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">🍽️</div>
            <div className="text-sm text-gray-600">Dine In & Takeaway</div>
          </div>
        </div>

        {/* Featured Items Preview */}
        {menuItems && menuItems.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Featured Items
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.slice(0, 3).map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center">
                    <span className="text-white text-4xl">
                      {item.category === 'main' ? '🍚' : 
                       item.name.toLowerCase().includes('chicken') ? '🍗' : 
                       item.name.toLowerCase().includes('plantain') ? '🍌' : '🍽️'}
                    </span>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-red-600">
                        ${(item.price / 100).toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.preparationTime} min
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleViewMenu}
            className="btn btn-primary w-full text-lg py-4"
          >
            View Full Menu
          </button>
          
          <button
            onClick={handleDirectOrder}
            className="btn btn-outline w-full text-lg py-4"
          >
            Quick Order Popular Items
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-2">
            Need help? Call us at <a href="tel:+2348012345678" className="text-red-600 hover:underline">+234 801 234 5678</a>
          </p>
          <p className="text-xs text-gray-400">
            Scan this QR code anytime to access our menu
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRLandingPage;