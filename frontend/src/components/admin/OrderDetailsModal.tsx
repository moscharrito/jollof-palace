import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  EnvelopeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../ui/LoadingSpinner';
import OrderStatusBadge from './OrderStatusBadge';
import { OrderStatus } from '../../types/order';
import { useOrderDetails } from '../../hooks/useOrderDetails';

interface OrderDetailsModalProps {
  orderId: string;
  onClose: () => void;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
}

const OrderDetailsModal = ({ orderId, onClose, onStatusUpdate }: OrderDetailsModalProps) => {
  const { order, loading, error, updateEstimatedTime } = useOrderDetails(orderId);
  const [newEstimatedTime, setNewEstimatedTime] = useState('');
  const [isUpdatingTime, setIsUpdatingTime] = useState(false);

  useEffect(() => {
    if (order?.estimatedReadyTime) {
      const date = new Date(order.estimatedReadyTime);
      setNewEstimatedTime(date.toISOString().slice(0, 16));
    }
  }, [order]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    await onStatusUpdate(orderId, newStatus);
  };

  const handleTimeUpdate = async () => {
    if (!newEstimatedTime) return;
    
    setIsUpdatingTime(true);
    try {
      await updateEstimatedTime(new Date(newEstimatedTime));
    } catch (error) {
      console.error('Failed to update estimated time:', error);
    } finally {
      setIsUpdatingTime(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount / 100);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
          <div className="text-center py-12">
            <p className="text-red-600">{error || 'Order not found'}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <p className="text-gray-600">Order #{order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status and Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
                <OrderStatusBadge 
                  status={order.status}
                  onStatusChange={handleStatusUpdate}
                  showDropdown={true}
                />
              </div>

              {/* Estimated Time Update */}
              {['CONFIRMED', 'PREPARING'].includes(order.status) && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Estimated Ready Time
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="datetime-local"
                      value={newEstimatedTime}
                      onChange={(e) => setNewEstimatedTime(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleTimeUpdate}
                      disabled={isUpdatingTime || !newEstimatedTime}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdatingTime ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.menuItem.imageUrl}
                        alt={item.menuItem.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                        {item.customizations && item.customizations.length > 0 && (
                          <p className="text-xs text-gray-400">
                            Customizations: {item.customizations.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(item.totalPrice)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.menuItem.preparationTime} min prep
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">{formatCurrency(order.tax)}</span>
                  </div>
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="text-gray-900">{formatCurrency(order.deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {order.specialInstructions && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <DocumentTextIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Special Instructions</h4>
                    <p className="text-sm text-yellow-700 mt-1">{order.specialInstructions}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="space-y-6">
            {/* Customer Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{order.customerName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <a 
                    href={`tel:${order.customerPhone}`}
                    className="text-red-600 hover:text-red-800"
                  >
                    {order.customerPhone}
                  </a>
                </div>
                {order.customerEmail && (
                  <div className="flex items-center space-x-2">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <a 
                      href={`mailto:${order.customerEmail}`}
                      className="text-red-600 hover:text-red-800"
                    >
                      {order.customerEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Information */}
            {order.orderType === 'DELIVERY' && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h3>
                <div className="flex items-start space-x-2">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="text-sm text-gray-900">
                    <p>{order.deliveryStreet}</p>
                    <p>{order.deliveryCity}, {order.deliveryState}</p>
                    {order.deliveryPostalCode && <p>{order.deliveryPostalCode}</p>}
                    {order.deliveryLandmark && (
                      <p className="text-gray-600 mt-1">
                        Landmark: {order.deliveryLandmark}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Order Timeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <div className="text-sm">
                    <p className="text-gray-900">Order Placed</p>
                    <p className="text-gray-500">{formatDateTime(order.createdAt)}</p>
                  </div>
                </div>
                
                {order.estimatedReadyTime && (
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4 text-blue-400" />
                    <div className="text-sm">
                      <p className="text-gray-900">Estimated Ready</p>
                      <p className="text-gray-500">{formatDateTime(order.estimatedReadyTime)}</p>
                    </div>
                  </div>
                )}
                
                {order.actualReadyTime && (
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4 text-green-400" />
                    <div className="text-sm">
                      <p className="text-gray-900">Actually Ready</p>
                      <p className="text-gray-500">{formatDateTime(order.actualReadyTime)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`font-medium ${
                    order.paymentStatus === 'COMPLETED' ? 'text-green-600' : 
                    order.paymentStatus === 'PENDING' ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="text-gray-900">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="text-gray-900 font-medium">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;