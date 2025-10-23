import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import OrderDetailsModal from '../../../components/admin/OrderDetailsModal';
import { useOrderDetails } from '../../../hooks/useOrderDetails';
import { Order } from '../../../types/order';

// Mock the hook
vi.mock('../../../hooks/useOrderDetails');

const mockUseOrderDetails = vi.mocked(useOrderDetails);

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
  deliveryPostalCode: '100001',
  deliveryLandmark: 'Near the big tree',
  subtotal: 2000,
  tax: 150,
  deliveryFee: 500,
  total: 2650,
  status: 'PREPARING',
  paymentStatus: 'COMPLETED',
  paymentMethod: 'card',
  estimatedReadyTime: '2024-01-15T12:30:00Z',
  actualReadyTime: undefined,
  specialInstructions: 'Extra spicy, no onions',
  createdAt: '2024-01-15T11:00:00Z',
  updatedAt: '2024-01-15T11:15:00Z',
  items: [
    {
      id: '1',
      quantity: 2,
      unitPrice: 1000,
      totalPrice: 2000,
      customizations: ['Extra spicy', 'No onions'],
      menuItem: {
        id: '1',
        name: 'Jollof Rice with Chicken',
        description: 'Delicious jollof rice with grilled chicken',
        imageUrl: '/images/jollof-chicken.jpg',
        preparationTime: 15
      }
    }
  ]
};

describe('OrderDetailsModal', () => {
  const mockOnClose = vi.fn();
  const mockOnStatusUpdate = vi.fn();
  const mockUpdateEstimatedTime = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseOrderDetails.mockReturnValue({
      order: mockOrder,
      loading: false,
      error: null,
      updateEstimatedTime: mockUpdateEstimatedTime,
      refetch: vi.fn()
    });
  });

  it('renders order details correctly', () => {
    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.getByText('Order Details')).toBeInTheDocument();
    expect(screen.getByText('Order #ORD-001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('+234-123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseOrderDetails.mockReturnValue({
      order: null,
      loading: true,
      error: null,
      updateEstimatedTime: mockUpdateEstimatedTime,
      refetch: vi.fn()
    });

    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorMessage = 'Order not found';
    mockUseOrderDetails.mockReturnValue({
      order: null,
      loading: false,
      error: errorMessage,
      updateEstimatedTime: mockUpdateEstimatedTime,
      refetch: vi.fn()
    });

    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('displays order items correctly', () => {
    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();
    expect(screen.getByText('Qty: 2 × ₦10.00')).toBeInTheDocument();
    expect(screen.getByText('Customizations: Extra spicy, No onions')).toBeInTheDocument();
    expect(screen.getByText('15 min prep')).toBeInTheDocument();
  });

  it('displays order totals correctly', () => {
    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.getByText('₦20.00')).toBeInTheDocument(); // Subtotal
    expect(screen.getByText('₦1.50')).toBeInTheDocument(); // Tax
    expect(screen.getByText('₦5.00')).toBeInTheDocument(); // Delivery fee
    expect(screen.getByText('₦26.50')).toBeInTheDocument(); // Total
  });

  it('displays delivery address for delivery orders', () => {
    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.getByText('Delivery Address')).toBeInTheDocument();
    expect(screen.getByText('123 Main Street')).toBeInTheDocument();
    expect(screen.getByText('Lagos, Lagos')).toBeInTheDocument();
    expect(screen.getByText('100001')).toBeInTheDocument();
    expect(screen.getByText('Landmark: Near the big tree')).toBeInTheDocument();
  });

  it('does not show delivery address for pickup orders', () => {
    const pickupOrder = { ...mockOrder, orderType: 'PICKUP' as const };
    mockUseOrderDetails.mockReturnValue({
      order: pickupOrder,
      loading: false,
      error: null,
      updateEstimatedTime: mockUpdateEstimatedTime,
      refetch: vi.fn()
    });

    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.queryByText('Delivery Address')).not.toBeInTheDocument();
  });

  it('displays special instructions', () => {
    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.getByText('Special Instructions')).toBeInTheDocument();
    expect(screen.getByText('Extra spicy, no onions')).toBeInTheDocument();
  });

  it('shows estimated time update for preparing orders', () => {
    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.getByText('Update Estimated Ready Time')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/2024-01-15T12:30/)).toBeInTheDocument();
  });

  it('does not show estimated time update for completed orders', () => {
    const completedOrder = { ...mockOrder, status: 'COMPLETED' as const };
    mockUseOrderDetails.mockReturnValue({
      order: completedOrder,
      loading: false,
      error: null,
      updateEstimatedTime: mockUpdateEstimatedTime,
      refetch: vi.fn()
    });

    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.queryByText('Update Estimated Ready Time')).not.toBeInTheDocument();
  });

  it('updates estimated time', async () => {
    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    const timeInput = screen.getByDisplayValue(/2024-01-15T12:30/);
    const updateButton = screen.getByText('Update');

    fireEvent.change(timeInput, { target: { value: '2024-01-15T13:00' } });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(mockUpdateEstimatedTime).toHaveBeenCalledWith(new Date('2024-01-15T13:00'));
    });
  });

  it('displays order timeline', () => {
    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.getByText('Order Timeline')).toBeInTheDocument();
    expect(screen.getByText('Order Placed')).toBeInTheDocument();
    expect(screen.getByText('Estimated Ready')).toBeInTheDocument();
  });

  it('displays payment information', () => {
    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.getByText('Payment Information')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('card')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes modal when X button is clicked', () => {
    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    const xButton = screen.getByRole('button', { name: '' }); // X icon button
    fireEvent.click(xButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('formats dates correctly', () => {
    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    // Check if dates are formatted in a readable format
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it('handles orders without special instructions', () => {
    const orderWithoutInstructions = { ...mockOrder, specialInstructions: undefined };
    mockUseOrderDetails.mockReturnValue({
      order: orderWithoutInstructions,
      loading: false,
      error: null,
      updateEstimatedTime: mockUpdateEstimatedTime,
      refetch: vi.fn()
    });

    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.queryByText('Special Instructions')).not.toBeInTheDocument();
  });

  it('handles orders without customizations', () => {
    const orderWithoutCustomizations = {
      ...mockOrder,
      items: [{
        ...mockOrder.items[0],
        customizations: []
      }]
    };
    
    mockUseOrderDetails.mockReturnValue({
      order: orderWithoutCustomizations,
      loading: false,
      error: null,
      updateEstimatedTime: mockUpdateEstimatedTime,
      refetch: vi.fn()
    });

    render(
      <OrderDetailsModal
        orderId="1"
        onClose={mockOnClose}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.queryByText(/Customizations:/)).not.toBeInTheDocument();
  });
});