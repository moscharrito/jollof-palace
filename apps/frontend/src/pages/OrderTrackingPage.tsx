import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CheckCircleIcon, ClockIcon, TruckIcon, WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { ArrowLeftIcon, ArrowPathIcon, BellIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useOrderTracking } from '../hooks/useOrderTracking';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const OrderTrackingPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const {
    order,
    isConnected,
    isLoading,
    error,
    lastUpdate,
    refreshOrder,
    requestNotificationPermission,
    reconnect,
  } = useOrderTracking(orderId || null);

  useEffect(() => {
    // Check if notifications are already enabled
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    
    if (granted) {
      toast.success('Notifications enabled! You\'ll be notified when your order is ready.');
    } else {
      toast.error('Notifications permission denied. You can enable them in your browser settings.');
    }
  };
  
  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceInCents / 100);
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const getStatusSteps = () => {
    if (!order) return [];
    
    const steps = [
      { id: 'pending', label: 'Order Received', icon: CheckCircleIcon },
      { id: 'confirmed', label: 'Order Confirmed', icon: CheckCircleIcon },
      { id: 'preparing', label: 'Preparing', icon: ClockIcon },
      { id: 'ready', label: order.orderType === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup', icon: TruckIcon },
      { id: 'completed', label: 'Completed', icon: CheckCircleIcon },
    ];
    
    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
    const currentIndex = statusOrder.indexOf(order.status);
    
    return steps.map((step, index) => ({
      ...step,
      isCompleted: index <= currentIndex,
      isCurrent: index === currentIndex,
    }));
  };
  
  const statusSteps = getStatusSteps();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Unable to Load Order
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'We couldn\'t find your order. Please check your order ID and try again.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={reconnect}
              className="btn btn-primary w-full"
            >
              Try Again
            </button>
            <Link
              to="/menu"
              className="btn btn-secondary w-full"
            >
              Back to Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find an order with ID: {orderId}
          </p>
          <Link
            to="/menu"
            className="btn btn-primary"
          >
            Back to Menu
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
          <Link
            to="/menu"
            className="inline-flex items-center text-red-600 hover:text-red-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Menu
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order Tracking
              </h1>
              <div className="flex items-center space-x-4">
                <p className="text-gray-600">
                  Order #{order.orderNumber} • Placed at {formatTime(new Date(order.createdAt))}
                </p>
                
                {/* Connection Status */}
                <div className={`flex items-center space-x-1 text-sm ${
                  isConnected ? 'text-green-600' : 'text-red-600'
                }`}>
                  <WifiIcon className="w-4 h-4" />
                  <span>{isConnected ? 'Live' : 'Offline'}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {!notificationsEnabled && (
                <button
                  onClick={handleEnableNotifications}
                  className="btn btn-outline btn-sm"
                >
                  <BellIcon className="w-4 h-4 mr-2" />
                  Enable Notifications
                </button>
              )}
              
              <button
                onClick={refreshOrder}
                className="btn btn-ghost btn-sm"
                disabled={isLoading}
              >
                <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Last Update */}
          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
          
          {/* Error Banner */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-800 text-sm">{error}</p>
                <button
                  onClick={reconnect}
                  className="ml-auto text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Reconnect
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Order Status
              </h3>
              
              <div className="space-y-6">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        step.isCompleted
                          ? 'bg-green-100 text-green-600'
                          : step.isCurrent
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="ml-4 flex-1">
                        <div className={`font-medium ${
                          step.isCompleted || step.isCurrent
                            ? 'text-gray-900'
                            : 'text-gray-500'
                        }`}>
                          {step.label}
                        </div>
                        
                        {step.isCurrent && (
                          <div className="text-sm text-gray-600 mt-1">
                            {step.id === 'preparing' && (
                              <>Estimated ready time: {formatTime(new Date(order.estimatedReadyTime))}</>
                            )}
                            {step.id === 'ready' && order.orderType === 'delivery' && (
                              <>Your order is on the way!</>
                            )}
                            {step.id === 'ready' && order.orderType === 'pickup' && (
                              <>Your order is ready for pickup</>
                            )}
                            {step.id === 'completed' && (
                              <>Order completed at {order.actualReadyTime ? formatTime(new Date(order.actualReadyTime)) : 'N/A'}</>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {index < statusSteps.length - 1 && (
                        <div className={`absolute left-5 mt-10 w-0.5 h-6 ${
                          step.isCompleted ? 'bg-green-200' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Estimated Time */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estimated {order.orderType === 'DELIVERY' ? 'Delivery' : 'Pickup'} Time
              </h3>
              
              <div className="flex items-center space-x-4">
                <div className="text-3xl">
                  {order.orderType === 'DELIVERY' ? '🚚' : '🏪'}
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {order.status === 'completed' && order.actualReadyTime 
                      ? formatTime(new Date(order.actualReadyTime))
                      : formatTime(new Date(order.estimatedReadyTime))
                    }
                  </div>
                  <div className="text-gray-600">
                    {order.status === 'completed' 
                      ? 'Completed at'
                      : order.orderType === 'delivery' 
                        ? 'Estimated delivery time' 
                        : 'Estimated ready time'
                    }
                  </div>
                </div>
              </div>
              
              {order.orderType === 'delivery' && order.customerInfo.deliveryAddress && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Delivery Address:</strong><br />
                    {order.customerInfo.deliveryAddress.street}<br />
                    {order.customerInfo.deliveryAddress.city}, {order.customerInfo.deliveryAddress.state} {order.customerInfo.deliveryAddress.postalCode}
                    {order.customerInfo.deliveryAddress.landmark && (
                      <><br />Landmark: {order.customerInfo.deliveryAddress.landmark}</>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Order Details */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Details
              </h3>
              
              {/* Items */}
              <div className="space-y-3 mb-6">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.menuItem.name}
                      </div>
                      <div className="text-gray-600">
                        Qty: {item.quantity}
                      </div>
                      {item.customizations && item.customizations.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {item.customizations.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="font-medium text-gray-900">
                      {formatPrice(item.totalPrice)}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total */}
              <div className="pt-4 border-t">
                <div className="flex justify-between text-lg font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-2">
                  Need Help?
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>📞 +1 (234) 567-890</div>
                  <div>✉️ support@jollofpalace.com</div>
                </div>
              </div>
              
              {/* Reorder Button */}
              <Link
                to="/menu"
                className="btn btn-outline w-full mt-6"
              >
                Order Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;