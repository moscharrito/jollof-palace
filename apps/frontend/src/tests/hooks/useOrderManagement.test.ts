import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useOrderManagement } from '../../hooks/useOrderManagement';
import { Order, OrderFilters } from '../../types/order';

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

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    customerName: 'John Doe',
    customerPhone: '+234-123-456-7890',
    customerEmail: 'john@example.com',
    orderType: 'PICKUP',
    subtotal: 2000,
    tax: 150,
    deliveryFee: 0,
    total: 2150,
    status: 'PENDING',
    paymentStatus: 'COMPLETED',
    paymentMethod: 'card',
    estimatedReadyTime: '2024-01-15T12:30:00Z',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
    items: []
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    customerName: 'Jane Smith',
    customerPhone: '+234-987-654-3210',
    orderType: 'DELIVERY',
    subtotal: 1500,
    tax: 112,
    deliveryFee: 500,
    total: 2112,
    status: 'PREPARING',
    paymentStatus: 'COMPLETED',
    paymentMethod: 'mobile_money',
    estimatedReadyTime: '2024-01-15T13:00:00Z',
    createdAt: '2024-01-15T11:30:00Z',
    updatedAt: '2024-01-15T11:30:00Z',
    items: []
  }
];

const mockPagination = {
  page: 1,
  limit: 20,
  total: 2,
  totalPages: 1
};

describe('useOrderManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches orders successfully', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrders,
        pagination: mockPagination
      }
    });

    const { result } = renderHook(() => useOrderManagement());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toEqual(mockOrders);
    expect(result.current.pagination).toEqual(mockPagination);
    expect(result.current.error).toBe(null);
  });

  it('handles fetch error', async () => {
    const errorMessage = 'Failed to fetch orders';
    mockApi.get.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useOrderManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
  });

  it('applies filters correctly', async () => {
    const filters: OrderFilters = {
      status: 'PENDING',
      orderType: 'PICKUP'
    };

    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: [mockOrders[0]], // Only pending pickup order
        pagination: { ...mockPagination, total: 1 }
      }
    });

    renderHook(() => useOrderManagement(filters));

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining('status=PENDING&orderType=PICKUP')
      );
    });
  });

  it('applies pagination correctly', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrders,
        pagination: mockPagination
      }
    });

    renderHook(() => useOrderManagement({}, 2, 10));

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2&limit=10')
      );
    });
  });

  it('updates order status successfully', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrders,
        pagination: mockPagination
      }
    });

    mockApi.put.mockResolvedValue({
      data: {
        success: true,
        data: { ...mockOrders[0], status: 'CONFIRMED' }
      }
    });

    const { result } = renderHook(() => useOrderManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.updateOrderStatus('1', 'CONFIRMED');

    expect(mockApi.put).toHaveBeenCalledWith('/orders/admin/1/status', {
      status: 'CONFIRMED'
    });

    // Check that the order status was updated in local state
    expect(result.current.orders[0].status).toBe('CONFIRMED');
  });

  it('handles update order status error', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrders,
        pagination: mockPagination
      }
    });

    const errorMessage = 'Failed to update order status';
    mockApi.put.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useOrderManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.updateOrderStatus('1', 'CONFIRMED')
    ).rejects.toThrow(errorMessage);

    expect(result.current.error).toBe(errorMessage);
  });

  it('performs bulk status update successfully', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrders,
        pagination: mockPagination
      }
    });

    mockApi.put.mockResolvedValue({
      data: {
        success: true,
        data: {}
      }
    });

    const { result } = renderHook(() => useOrderManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.bulkUpdateStatus(['1', '2'], 'CONFIRMED');

    expect(mockApi.put).toHaveBeenCalledTimes(2);
    expect(mockApi.put).toHaveBeenCalledWith('/orders/admin/1/status', {
      status: 'CONFIRMED'
    });
    expect(mockApi.put).toHaveBeenCalledWith('/orders/admin/2/status', {
      status: 'CONFIRMED'
    });

    // Check that both orders were updated in local state
    expect(result.current.orders[0].status).toBe('CONFIRMED');
    expect(result.current.orders[1].status).toBe('CONFIRMED');
  });

  it('handles bulk update error', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrders,
        pagination: mockPagination
      }
    });

    const errorMessage = 'Failed to bulk update orders';
    mockApi.put.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useOrderManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.bulkUpdateStatus(['1', '2'], 'CONFIRMED')
    ).rejects.toThrow(errorMessage);

    expect(result.current.error).toBe(errorMessage);
  });

  it('refetches orders', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrders,
        pagination: mockPagination
      }
    });

    const { result } = renderHook(() => useOrderManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear the mock to count new calls
    mockApi.get.mockClear();

    await result.current.refetch();

    expect(mockApi.get).toHaveBeenCalledTimes(1);
  });

  it('filters out empty filter values', async () => {
    const filters: OrderFilters = {
      status: 'PENDING',
      orderType: undefined,
      customerPhone: '',
      dateFrom: '2024-01-15'
    };

    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrders,
        pagination: mockPagination
      }
    });

    renderHook(() => useOrderManagement(filters));

    await waitFor(() => {
      const callUrl = mockApi.get.mock.calls[0][0];
      expect(callUrl).toContain('status=PENDING');
      expect(callUrl).toContain('dateFrom=2024-01-15');
      expect(callUrl).not.toContain('orderType=');
      expect(callUrl).not.toContain('customerPhone=');
    });
  });

  it('handles API response without success flag', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: false,
        message: 'Custom error message'
      }
    });

    const { result } = renderHook(() => useOrderManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Custom error message');
    expect(result.current.orders).toEqual([]);
  });

  it('handles update status API response without success flag', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrders,
        pagination: mockPagination
      }
    });

    mockApi.put.mockResolvedValue({
      data: {
        success: false,
        message: 'Update failed'
      }
    });

    const { result } = renderHook(() => useOrderManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.updateOrderStatus('1', 'CONFIRMED')
    ).rejects.toThrow('Update failed');
  });
});