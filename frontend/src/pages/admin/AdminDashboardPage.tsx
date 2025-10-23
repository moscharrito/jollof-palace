import { useState, useEffect } from 'react';

import { 
  ClipboardDocumentListIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,

} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  activeCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  estimatedReadyTime?: string;
}



const AdminDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {
    // Mock data for now - will be replaced with actual API calls
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock stats
      setStats({
        totalOrders: 156,
        pendingOrders: 8,
        completedOrders: 148,
        totalRevenue: 15420,
        todayRevenue: 890,
        activeCustomers: 89,
        averageOrderValue: 2850,
        revenueGrowth: 12.5,
        orderGrowth: 8.3
      });

      // Mock recent orders
      setRecentOrders([
        {
          id: '1',
          orderNumber: 'JP-001',
          customerName: 'John Doe',
          total: 2500,
          status: 'PREPARING',
          createdAt: '2024-01-15T10:30:00Z',
          estimatedReadyTime: '2024-01-15T11:00:00Z'
        },
        {
          id: '2',
          orderNumber: 'JP-002',
          customerName: 'Jane Smith',
          total: 1800,
          status: 'READY',
          createdAt: '2024-01-15T10:15:00Z'
        },
        {
          id: '3',
          orderNumber: 'JP-003',
          customerName: 'Mike Johnson',
          total: 3200,
          status: 'COMPLETED',
          createdAt: '2024-01-15T09:45:00Z'
        },
        {
          id: '4',
          orderNumber: 'JP-004',
          customerName: 'Sarah Wilson',
          total: 1950,
          status: 'PENDING',
          createdAt: '2024-01-15T10:45:00Z'
        },
        {
          id: '5',
          orderNumber: 'JP-005',
          customerName: 'David Brown',
          total: 2750,
          status: 'CONFIRMED',
          createdAt: '2024-01-15T10:50:00Z'
        }
      ]);


      
      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800';
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Welcome to your restaurant management dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Total Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
              <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 truncate">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders}</p>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 truncate">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingOrders}</p>
            </div>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 truncate">Completed Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.completedOrders}</p>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 truncate">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.totalRevenue || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 truncate">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.todayRevenue || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 truncate">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeCustomers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.customerName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;