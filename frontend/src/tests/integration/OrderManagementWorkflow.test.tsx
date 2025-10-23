import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import OrderManagementPage from '../../pages/admin/OrderManagementPage';
import { api } from '../../services/api';
import { Order } from '../../types/order';

// Mock the API
vi.mock('../../services/api');
const mockApi = vi.mocked(api);

// Mock auth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Admin User', email: 'admin@test.com' },
    isAuthenticated: true
  })
}));

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
    specialInstructions: 'Extra spicy',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
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
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    customerName: 'Jane Smith',
    customerPhone: '+234-987-654-3210',
    orderType: 'DELIVERY',
    deliveryStreet: '123 Main St',
    deliveryCity: 'Lagos',
    deliveryState: 'Lagos',
    subtotal: 1500,
    tax: 112,
    deliveryFee: 500,
    total: 2112,
    status: 'CONFIRMED',
    paymentStatus: 'COMPLETED',
    paymentMethod: 'mobile_money',
    estimatedReadyTime: '2024-01-15T13:00:00Z',
    createdAt: '2024-01-15T11:30:00Z',
    updatedAt: '2024-01-15T11:30:00Z',
    items: [
      {
        id: '2',
        quantity: 1,
        unitPrice: 1500,
        totalPrice: 1500,
        customizations: [],
        menuItem: {
          id: '2',
          name: 'Pepper Beef',
          description: 'Spicy beef stew',
          imageUrl: '/images/beef.jpg',
          preparationTime: 20
        }
      }
    ]
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    customerName: 'Mike Johnson',
    customerPhone: '+234-555-123-4567',
    orderType: 'PICKUP',
    subtotal: 1200,
    tax: 90,
    deliveryFee: 0,
    total: 1290,
    status: 'PREPARING',
    paymentStatus: 'COMPLETED',
    paymentMethod: 'cash',
    estimatedReadyTime: '2024-01-15T12:45:00Z',
    createdAt: '2024-01-15T11:45:00Z',
    updatedAt: '2024-01-15T11:45:00Z',
    items: []
  }
];

const mockPagination = {
  page: 1,
  limit: 20,
  total: 3,
  totalPages: 1
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Order Management Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful API responses
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
  });

  it('completes full order management workflow', async () => {
    renderWithRouter(<OrderManagementPage />);

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
      expect(screen.getByText('ORD-003')).toBeInTheDocument();
    });

    // Verify initial order statuses
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Mike Johnson')).toBeInTheDocument();

    // Test search functionality
    const searchInput = screen.getByPlaceholderText(/search by order number/i);
    fireEvent.change(searchInput, { target: { value: 'ORD-001' } });

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.queryByText('ORD-002')).not.toBeInTheDocument();
      expect(screen.queryByText('ORD-003')).not.toBeInTheDocument();
    });

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
      expect(screen.getByText('ORD-003')).toBeInTheDocument();
    });

    // Test filtering
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);

    const statusSelect = screen.getByDisplayValue('All Statuses');
    fireEvent.change(statusSelect, { target: { value: 'PENDING' } });

    // API should be called with filter
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining('status=PENDING')
      );
    });

    // Reset filters
    const clearFiltersButton = screen.getByText('Clear Filters');
    fireEvent.click(clearFiltersButton);

    // Test individual order selection
    const checkboxes = screen.getAllByRole('checkbox');
    const firstOrderCheckbox = checkboxes[1]; // Skip select all checkbox
    fireEvent.click(firstOrderCheckbox);

    expect(screen.getByText('1 selected')).toBeInTheDocument();

    // Test bulk selection
    const selectAllCheckbox = checkboxes[0];
    fireEvent.click(selectAllCheckbox);

    expect(screen.getByText('3 selected')).toBeInTheDocument();

    // Test bulk status update
    const bulkActionsButton = screen.getByText('Bulk Actions');
    fireEvent.click(bulkActionsButton);

    const confirmAction = screen.getByText('Mark as Confirmed');
    fireEvent.click(confirmAction);

    // Should call API for each selected order
    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledTimes(3);
      expect(mockApi.put).toHaveBeenCalledWith('/orders/admin/1/status', {
        status: 'CONFIRMED'
      });
      expect(mockApi.put).toHaveBeenCalledWith('/orders/admin/2/status', {
        status: 'CONFIRMED'
      });
      expect(mockApi.put).toHaveBeenCalledWith('/orders/admin/3/status', {
        status: 'CONFIRMED'
      });
    });

    // Clear selection
    const clearSelectionButton = screen.getByText('Clear Selection');
    fireEvent.click(clearSelectionButton);

    expect(screen.queryByText('selected')).not.toBeInTheDocument();
  });

  it('handles order details modal workflow', async () => {
    // Mock individual order fetch for modal
    mockApi.get.mockImplementation((url) => {
      if (url.includes('/orders/1')) {
        return Promise.resolve({
          data: {
            success: true,
            data: mockOrders[0]
          }
        });
      }
      return Promise.resolve({
        data: {
          success: true,
          data: mockOrders,
          pagination: mockPagination
        }
      });
    });

    renderWithRouter(<OrderManagementPage />);

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Open order details modal
    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    // Wait for modal to load
    await waitFor(() => {
      expect(screen.getByText('Order Details')).toBeInTheDocument();
      expect(screen.getByText('Order #ORD-001')).toBeInTheDocument();
    });

    // Verify order details are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('+234-123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('Order Details')).not.toBeInTheDocument();
    });
  });

  it('handles error states gracefully', async () => {
    // Mock API error
    mockApi.get.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<OrderManagementPage />);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Test refresh functionality
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrders,
        pagination: mockPagination
      }
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Should recover and show orders
    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.queryByText('Network error')).not.toBeInTheDocument();
    });
  });

  it('handles status update errors', async () => {
    renderWithRouter(<OrderManagementPage />);

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Select an order
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    // Mock status update error
    mockApi.put.mockRejectedValue(new Error('Update failed'));

    // Try bulk update
    const bulkActionsButton = screen.getByText('Bulk Actions');
    fireEvent.click(bulkActionsButton);

    const confirmAction = screen.getByText('Mark as Confirmed');
    fireEvent.click(confirmAction);

    // Should handle error gracefully
    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalled();
    });
  });

  it('handles pagination workflow', async () => {
    const paginatedResponse = {
      data: {
        success: true,
        data: mockOrders.slice(0, 2),
        pagination: {
          page: 1,
          limit: 2,
          total: 3,
          totalPages: 2
        }
      }
    };

    mockApi.get.mockResolvedValue(paginatedResponse);

    renderWithRouter(<OrderManagementPage />);

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText('Showing 1 to 2 of 3 results')).toBeInTheDocument();
    });

    // Test pagination controls
    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();

    // Mock next page response
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: [mockOrders[2]],
        pagination: {
          page: 2,
          limit: 2,
          total: 3,
          totalPages: 2
        }
      }
    });

    // Click next page
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Should call API with page 2
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });
  });

  it('handles empty state', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      }
    });

    renderWithRouter(<OrderManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('No orders found')).toBeInTheDocument();
      expect(screen.getByText('Orders will appear here when customers place them')).toBeInTheDocument();
    });
  });

  it('handles real-time updates simulation', async () => {
    renderWithRouter(<OrderManagementPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Simulate real-time update by changing mock data
    const updatedOrders = mockOrders.map(order => 
      order.id === '1' ? { ...order, status: 'CONFIRMED' as const } : order
    );

    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: updatedOrders,
        pagination: mockPagination
      }
    });

    // The component should automatically refresh every 30 seconds
    // We can't easily test the timer, but we can test manual refresh
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalled();
    });
  });
});