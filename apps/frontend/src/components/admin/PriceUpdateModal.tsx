import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { MenuItem } from '../../types/menu';
import { menuService } from '../../services/menuService';

interface PriceUpdateModalProps {
  item: MenuItem;
  onClose: () => void;
  onSave: () => void;
}

interface PriceHistoryEntry {
  id: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  reason?: string;
  createdAt: string;
}

const PriceUpdateModal = ({ item, onClose, onSave }: PriceUpdateModalProps) => {
  const [newPrice, setNewPrice] = useState((item.price / 100).toString());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const currentPrice = item.price / 100;
  const newPriceValue = parseFloat(newPrice) || 0;
  const priceChange = newPriceValue - currentPrice;
  const priceChangePercent = currentPrice > 0 ? (priceChange / currentPrice) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPrice || parseFloat(newPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (parseFloat(newPrice) === currentPrice) {
      toast.error('New price must be different from current price');
      return;
    }

    setLoading(true);

    try {
      await menuService.updateMenuItemPrice(item.id, {
        price: Math.round(parseFloat(newPrice) * 100), // Convert to cents
        reason: reason.trim() || undefined,
      });

      toast.success('Price updated successfully');
      onSave();
    } catch (error) {
      toast.error('Failed to update price');
      console.error('Error updating price:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPriceHistory = async () => {
    if (showHistory && priceHistory.length === 0) {
      setHistoryLoading(true);
      try {
        const history = await menuService.getPriceHistory(item.id);
        setPriceHistory(history);
      } catch (error) {
        toast.error('Failed to load price history');
        console.error('Error loading price history:', error);
      } finally {
        setHistoryLoading(false);
      }
    }
    setShowHistory(!showHistory);
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriceChangeColor = () => {
    if (priceChange > 0) return 'text-green-600';
    if (priceChange < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPriceChangeIcon = () => {
    if (priceChange > 0) return '↗';
    if (priceChange < 0) return '↘';
    return '→';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Update Price</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Item Info */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.category}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Current Price</div>
              <div className="text-2xl font-bold text-gray-900">
                ${currentPrice.toFixed(2)}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Price Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="0.00"
                required
              />
            </div>

            {/* Price Change Preview */}
            {newPriceValue > 0 && newPriceValue !== currentPrice && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Price Change</span>
                  <span className={`text-sm font-medium ${getPriceChangeColor()}`}>
                    {getPriceChangeIcon()} ${Math.abs(priceChange).toFixed(2)} ({Math.abs(priceChangePercent).toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}

            {/* Reason Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Change (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter reason for price change..."
              />
            </div>

            {/* Price History Toggle */}
            <div>
              <button
                type="button"
                onClick={loadPriceHistory}
                className="flex items-center text-sm text-red-600 hover:text-red-700"
              >
                <ClockIcon className="h-4 w-4 mr-1" />
                {showHistory ? 'Hide' : 'Show'} Price History
              </button>
            </div>

            {/* Price History */}
            {showHistory && (
              <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Price History</h4>
                {historyLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
                  </div>
                ) : priceHistory.length > 0 ? (
                  <div className="space-y-2">
                    {priceHistory.map((entry) => (
                      <div key={entry.id} className="text-xs border-b border-gray-100 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">
                              {formatCurrency(entry.oldPrice)} → {formatCurrency(entry.newPrice)}
                            </span>
                            <div className="text-gray-500 mt-1">
                              {formatDate(entry.createdAt)} by {entry.changedBy}
                            </div>
                            {entry.reason && (
                              <div className="text-gray-600 mt-1 italic">"{entry.reason}"</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-2">
                    No price history available
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !newPrice || parseFloat(newPrice) <= 0 || parseFloat(newPrice) === currentPrice}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Price'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PriceUpdateModal;