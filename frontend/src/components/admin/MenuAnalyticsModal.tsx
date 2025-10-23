import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { XMarkIcon, ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { menuService } from '../../services/menuService';

interface MenuItemAnalytics {
  itemId: string;
  name: string;
  category: string;
  totalOrders: number;
  totalQuantitySold: number;
  totalRevenue: number;
  averageOrderValue: number;
  popularityRank: number;
  lastOrderDate?: string;
  salesTrend: 'up' | 'down' | 'stable';
}

interface MenuAnalyticsModalProps {
  onClose: () => void;
}

const MenuAnalyticsModal = ({ onClose }: MenuAnalyticsModalProps) => {
  const [analytics, setAnalytics] = useState<MenuItemAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // Today
  });
  const [sortBy, setSortBy] = useState<'revenue' | 'quantity' | 'orders' | 'popularity'>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await menuService.getMenuAnalytics(dateRange.startDate, dateRange.endDate);
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to load menu analytics');
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getSortedAnalytics = () => {
    const sorted = [...analytics].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case 'revenue':
          aValue = a.totalRevenue;
          bValue = b.totalRevenue;
          break;
        case 'quantity':
          aValue = a.totalQuantitySold;
          bValue = b.totalQuantitySold;
          break;
        case 'orders':
          aValue = a.totalOrders;
          bValue = b.totalOrders;
          break;
        case 'popularity':
          aValue = a.popularityRank;
          bValue = b.popularityRank;
          break;
        default:
          return 0;
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return sorted;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'MAIN':
        return 'bg-blue-100 text-blue-800';
      case 'SIDE':
        return 'bg-green-100 text-green-800';
      case 'COMBO':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalRevenue = analytics.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalQuantity = analytics.reduce((sum, item) => sum + item.totalQuantitySold, 0);
  const totalOrders = analytics.reduce((sum, item) => sum + item.totalOrders, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 text-red-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Menu Analytics</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Date Range Selector */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="revenue">Revenue</option>
                  <option value="quantity">Quantity Sold</option>
                  <option value="orders">Total Orders</option>
                  <option value="popularity">Popularity Rank</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-600">Total Revenue</div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalRevenue)}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-600">Items Sold</div>
              <div className="text-2xl font-bold text-green-900">{totalQuantity.toLocaleString()}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-purple-600">Total Orders</div>
              <div className="text-2xl font-bold text-purple-900">{totalOrders.toLocaleString()}</div>
            </div>
          </div>

          {/* Analytics Table */}
          <div className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity Sold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Order Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getSortedAnalytics().map((item) => (
                      <tr key={item.itemId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.totalQuantitySold.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.totalOrders.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.averageOrderValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{item.popularityRank}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.lastOrderDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTrendIcon(item.salesTrend)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {analytics.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500">
                      No analytics data available for the selected date range
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuAnalyticsModal;