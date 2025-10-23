import { useState, useEffect, useCallback } from 'react';
import { Order } from '../types/order';
import api from '../services/api';

interface UseOrderDetailsReturn {
  order: Order | null;
  loading: boolean;
  error: string | null;
  updateEstimatedTime: (newTime: Date) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useOrderDetails = (orderId: string): UseOrderDetailsReturn => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/orders/${orderId}`);
      
      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch order details');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order details';
      setError(errorMessage);
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const updateEstimatedTime = useCallback(async (newTime: Date) => {
    try {
      const response = await api.put(`/orders/admin/${orderId}/estimated-time`, {
        estimatedReadyTime: newTime.toISOString()
      });
      
      if (response.data.success) {
        setOrder(prevOrder => 
          prevOrder 
            ? { ...prevOrder, estimatedReadyTime: newTime.toISOString() }
            : null
        );
      } else {
        throw new Error(response.data.message || 'Failed to update estimated time');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update estimated time';
      setError(errorMessage);
      throw err;
    }
  }, [orderId]);

  const refetch = useCallback(async () => {
    await fetchOrderDetails();
  }, [fetchOrderDetails]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [fetchOrderDetails, orderId]);

  return {
    order,
    loading,
    error,
    updateEstimatedTime,
    refetch
  };
};