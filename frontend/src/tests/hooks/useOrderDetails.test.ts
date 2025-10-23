import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useOrderDetails } from '../../hooks/useOrderDetails';
import { Order } from '../../types/order';

// Mock the API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

import api from '../../services/api';
const mockApi = vi.mocked(api);

const mockOrder: Order = {
  id: '1',
  orderNumber: 'ORD-001',
  customerName: 'John Doe',
  customerPhone: '+234-123-456-7890',
  customerEmail: 'john@example.com',
  orderType: 'DELIVERY',
  deliveryStreet: '123 Main Street',
  deliveryCity: 'Lagos',
  deliveryState: 'Lagos',
  subtotal: 2000,
  tax: 150,
  deliveryFee: 500,
  total: 2650,
  status: 'PREPARING',
  paymentStatus: 'COMPLETED',
  paymentMethod: 'card',
  estimatedReadyTime: '2024-01-15T12:30:00Z',
  specialInstructions: 'Extra spicy',
  createdAt: '2024-01-15T11:00:00Z',
  updatedAt: '2024-01-15T11:15:00Z',
  items: [
    {
      id: '1',
      quantity: 2,
      unitPrice: 1000,
      totalPrice: 2000,
      customizations: ['Extra spicy'],
      menuItem: {
        id: '1',
        name: 'Jollof Rice with Chicken',
        description: 'Delicious jollof rice',
        imageUrl: '/images/jollof.jpg',
        preparationTime: 15
      }
    }
  ]
};

describe('useOrderDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches order details successfully', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrder
      }
    });

    const { result } = renderHook(() => useOrderDetails('1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.order).toEqual(mockOrder);
    expect(result.current.error).toBe(null);
    expect(mockApi.get).toHaveBeenCalledWith('/orders/1');
  });

  it('handles fetch error', async () => {
    const errorMessage = 'Order not found';
    mockApi.get.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useOrderDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.order).toBe(null);
    expect(result.current.error).toBe(errorMessage);
  });

  it('handles API response without success flag', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: false,
        message: 'Order not found'
      }
    });

    const { result } = renderHook(() => useOrderDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.order).toBe(null);
    expect(result.current.error).toBe('Order not found');
  });

  it('updates estimated time successfully', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrder
      }
    });

    mockApi.put.mockResolvedValue({
      data: {
        success: true,
        data: { ...mockOrder, estimatedReadyTime: '2024-01-15T13:00:00Z' }
      }
    });

    const { result } = renderHook(() => useOrderDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newTime = new Date('2024-01-15T13:00:00Z');
    await result.current.updateEstimatedTime(newTime);

    expect(mockApi.put).toHaveBeenCalledWith('/orders/admin/1/estimated-time', {
      estimatedReadyTime: newTime.toISOString()
    });

    expect(result.current.order?.estimatedReadyTime).toBe('2024-01-15T13:00:00Z');
  });

  it('handles update estimated time error', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrder
      }
    });

    const errorMessage = 'Failed to update estimated time';
    mockApi.put.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useOrderDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newTime = new Date('2024-01-15T13:00:00Z');
    
    await expect(
      result.current.updateEstimatedTime(newTime)
    ).rejects.toThrow(errorMessage);

    expect(result.current.error).toBe(errorMessage);
  });

  it('handles update estimated time API response without success flag', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrder
      }
    });

    mockApi.put.mockResolvedValue({
      data: {
        success: false,
        message: 'Update failed'
      }
    });

    const { result } = renderHook(() => useOrderDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newTime = new Date('2024-01-15T13:00:00Z');
    
    await expect(
      result.current.updateEstimatedTime(newTime)
    ).rejects.toThrow('Update failed');
  });

  it('refetches order details', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrder
      }
    });

    const { result } = renderHook(() => useOrderDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear the mock to count new calls
    mockApi.get.mockClear();

    await result.current.refetch();

    expect(mockApi.get).toHaveBeenCalledTimes(1);
    expect(mockApi.get).toHaveBeenCalledWith('/orders/1');
  });

  it('does not fetch when orderId is empty', () => {
    const { result } = renderHook(() => useOrderDetails(''));

    expect(result.current.loading).toBe(true);
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it('refetches when orderId changes', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrder
      }
    });

    const { result, rerender } = renderHook(
      ({ orderId }) => useOrderDetails(orderId),
      { initialProps: { orderId: '1' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApi.get).toHaveBeenCalledWith('/orders/1');

    // Change orderId
    rerender({ orderId: '2' });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/orders/2');
    });

    expect(mockApi.get).toHaveBeenCalledTimes(2);
  });

  it('handles null order when updating estimated time', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: null
      }
    });

    const { result } = renderHook(() => useOrderDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.order).toBe(null);

    // Try to update estimated time when order is null
    const newTime = new Date('2024-01-15T13:00:00Z');
    
    mockApi.put.mockResolvedValue({
      data: {
        success: true,
        data: {}
      }
    });

    await result.current.updateEstimatedTime(newTime);

    // Should still call the API
    expect(mockApi.put).toHaveBeenCalled();
    
    // Order should remain null since there was no previous order
    expect(result.current.order).toBe(null);
  });

  it('preserves other order properties when updating estimated time', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrder
      }
    });

    mockApi.put.mockResolvedValue({
      data: {
        success: true,
        data: {}
      }
    });

    const { result } = renderHook(() => useOrderDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const originalOrder = result.current.order;
    const newTime = new Date('2024-01-15T13:00:00Z');
    
    await result.current.updateEstimatedTime(newTime);

    // Check that other properties are preserved
    expect(result.current.order?.id).toBe(originalOrder?.id);
    expect(result.current.order?.orderNumber).toBe(originalOrder?.orderNumber);
    expect(result.current.order?.customerName).toBe(originalOrder?.customerName);
    expect(result.current.order?.estimatedReadyTime).toBe(newTime.toISOString());
  });
});