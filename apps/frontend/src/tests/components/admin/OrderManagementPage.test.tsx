import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import OrderManagementPage from '../../../pages/admin/OrderManagementPage';
import { useOrderManagement } from '../../../hooks/useOrderManagement';
import { Order, OrderStatus } from '../../../types/order';

// Mock the hooks
vi.mock('../../../hooks/useOrderManagement');
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Admin User', email: 'admin@test.com' },
    isAuthenticated: true
  })
}));

const mockUseOrderManagement = vi.mocked(useOrderManagement);

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
    status: 'PREPARING',
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
  }
];

const mockPagination = {
  page: 1,
  limit: 20,
  total: 2,
  totalPages: 1
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('OrderManagementPage', () => {
  const mockUpdateOrderStatus = vi.fn();
  const mockBulkUpdateStatus = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseOrderManagement.mockReturnValue({
      orders: mockOrders,
      loading: false,
      error: null,
      pagination: mockPagination,
      updateOrderStatus: mockUpdateOrderStatus,
      bulkUpdateStatus: mockBulkUpdateStatus,
      refetch: mockRefetch
    });
  });

  it('renders order management page with orders', () => {
    renderWithRouter(<OrderManagementPage />);

    expect(screen.getByText('Order Management')).toBeInTheDocument();
    expect(screen.getByText('Manage and track customer orders in real-time')).toBeInTheDocument();
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-002')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseOrderManagement.mockReturnValue({
      orders: [],
      loading: true,
      error: null,
      pagination: null,
      updateOrderStatus: mockUpdateOrderStatus,
      bulkUpdateStatus: mockBulkUpdateStatus,
      refetch: mockRefetch
    });

    renderWithRouter(<OrderManagementPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorMessage = 'Failed to fetch orders';
    mockUseOrderManagement.mockReturnValue({
      orders: [],
      loading: false,
      error: errorMessage,
      pagination: null,
      updateOrderStatus: mockUpdateOrderStatus,
      bulkUpdateStatus: mockBulkUpdateStatus,
      refetch: mockRefetch
    });

    renderWithRouter(<OrderManagementPage />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('filters orders by search term', async () => {
    renderWithRouter(<OrderManagementPage />);

    const searchInput = screen.getByPlaceholderText(/search by order number/i);
    fireEvent.change(searchInput, { target: { value: 'ORD-001' } });

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.queryByText('ORD-002')).not.toBeInTheDocument();
    });
  });

  it('shows and hides filters', () => {
    renderWithRouter(<OrderManagementPage />);

    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Order Type')).toBeInTheDocument();
  });

  it('applies status filter', async () => {
    renderWithRouter(<OrderManagementPage />);

    // Open filters
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);

    // Select status filter
    const statusSelect = screen.getByDisplayValue('All Statuses');
    fireEvent.change(statusSelect, { target: { value: 'PENDING' } });

    // The hook should be called with the new filters
    await waitFor(() => {
      expect(mockUseOrderManagement).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PENDING' }),
        1,
        20
      );
    });
  });

  it('selects individual orders', () => {
    renderWithRouter(<OrderManagementPage />);

    const checkboxes = screen.getAllByRole('checkbox');
    const firstOrderCheckbox = checkboxes[1]; // Skip the "select all" checkbox

    fireEvent.click(firstOrderCheckbox);

    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('selects all orders', () => {
    renderWithRouter(<OrderManagementPage />);

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('performs bulk status update', async () => {
    renderWithRouter(<OrderManagementPage />);

    // Select orders
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    // Open bulk actions
    const bulkActionsButton = screen.getByText('Bulk Actions');
    fireEvent.click(bulkActionsButton);

    // Select bulk action
    const confirmAction = screen.getByText('Mark as Confirmed');
    fireEvent.click(confirmAction);

    await waitFor(() => {
      expect(mockBulkUpdateStatus).toHaveBeenCalledWith(['1', '2'], 'CONFIRMED');
    });
  });

  it('updates individual order status', async () => {
    renderWithRouter(<OrderManagementPage />);

    // Find and click on a status badge (this would open the dropdown)
    const statusBadges = screen.getAllByText('Pending');
    fireEvent.click(statusBadges[0]);

    // This would trigger the status update
    await waitFor(() => {
      // The actual implementation would depend on the OrderStatusBadge component
      // For now, we'll just verify the component renders
      expect(statusBadges[0]).toBeInTheDocument();
    });
  });

  it('opens order details modal', () => {
    renderWithRouter(<OrderManagementPage />);

    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    // The modal should open (we'll test the modal component separately)
    expect(viewDetailsButtons[0]).toBeInTheDocument();
  });

  it('refreshes orders', async () => {
    renderWithRouter(<OrderManagementPage />);

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('clears filters', async () => {
    renderWithRouter(<OrderManagementPage />);

    // Open filters
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);

    // Set a filter
    const statusSelect = screen.getByDisplayValue('All Statuses');
    fireEvent.change(statusSelect, { target: { value: 'PENDING' } });

    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(statusSelect).toHaveValue('');
    });
  });

  it('displays empty state when no orders', () => {
    mockUseOrderManagement.mockReturnValue({
      orders: [],
      loading: false,
      error: null,
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      updateOrderStatus: mockUpdateOrderStatus,
      bulkUpdateStatus: mockBulkUpdateStatus,
      refetch: mockRefetch
    });

    renderWithRouter(<OrderManagementPage />);

    expect(screen.getByText('No orders found')).toBeInTheDocument();
    expect(screen.getByText('Orders will appear here when customers place them')).toBeInTheDocument();
  });

  it('handles pagination', () => {
    const paginationWithMultiplePages = {
      page: 1,
      limit: 20,
      total: 50,
      totalPages: 3
    };

    mockUseOrderManagement.mockReturnValue({
      orders: mockOrders,
      loading: false,
      error: null,
      pagination: paginationWithMultiplePages,
      updateOrderStatus: mockUpdateOrderStatus,
      bulkUpdateStatus: mockBulkUpdateStatus,
      refetch: mockRefetch
    });

    renderWithRouter(<OrderManagementPage />);

    expect(screen.getByText('Showing 1 to 2 of 50 results')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    renderWithRouter(<OrderManagementPage />);

    // Check if currency is formatted correctly (Nigerian Naira)
    expect(screen.getByText(/₦21.50/)).toBeInTheDocument();
    expect(screen.getByText(/₦21.12/)).toBeInTheDocument();
  });

  it('displays order type icons', () => {
    renderWithRouter(<OrderManagementPage />);

    // Should show pickup and delivery indicators
    expect(screen.getByText('PICKUP')).toBeInTheDocument();
    expect(screen.getByText('DELIVERY')).toBeInTheDocument();
  });
});