import { useState, useEffect, useCallback } from 'react';
import { Order, OrderFilters, OrderStatus, Pagination } from '../types/order';
import api from '../services/api';

interface UseOrderManagementReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  bulkUpdateStatus: (orderIds: string[], status: OrderStatus) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useOrderManagement = (
  filters: OrderFilters = {},
  page: number = 1,
  limit: number = 20
): UseOrderManagementReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      });

      const response = await api.get(`/orders/admin?${params}`);
      
      if (response.data.success) {
        setOrders(response.data.data);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      const response = await api.put(`/orders/admin/${orderId}/status`, { status });
      
      if (response.data.success) {
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status, updatedAt: new Date().toISOString() }
              : order
          )
        );
      } else {
        throw new Error(response.data.message || 'Failed to update order status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const bulkUpdateStatus = useCallback(async (orderIds: string[], status: OrderStatus) => {
    try {
      // Update orders one by one (could be optimized with a bulk endpoint)
      const updatePromises = orderIds.map(orderId => 
        api.put(`/orders/admin/${orderId}/status`, { status })
      );

      await Promise.all(updatePromises);

      // Update the orders in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          orderIds.includes(order.id)
            ? { ...order, status, updatedAt: new Date().toISOString() }
            : order
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update orders';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    pagination,
    updateOrderStatus,
    bulkUpdateStatus,
    refetch
  };
};