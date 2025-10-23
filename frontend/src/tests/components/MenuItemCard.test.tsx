import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { MenuItem } from '@food-ordering/shared';
import MenuItemCard from '../../components/menu/MenuItemCard';
import { CartProvider } from '../../contexts/CartContext';
import toast from 'react-hot-toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock cart hook
const mockAddItem = vi.fn();
vi.mock('../../hooks/useCart', () => ({
  useCart: () => ({
    addItem: mockAddItem,
    items: [],
    totalItems: 0,
    totalPrice: 0,
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
  }),
}));

const mockMenuItem: MenuItem = {
  id: '1',
  name: 'Signature Jollof Rice',
  description: 'Our famous Jollof rice cooked with aromatic spices, fresh tomatoes, and your choice of protein.',
  price: 1500,
  category: 'main',
  imageUrl: '/images/jollof-rice.jpg',
  preparationTime: 15,
  isAvailable: true,
  ingredients: ['Rice', 'Tomatoes', 'Onions', 'Spices'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const unavailableMenuItem: MenuItem = {
  ...mockMenuItem,
  id: '2',
  name: 'Unavailable Item',
  isAvailable: false,
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CartProvider>
          {children}
        </CartProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('MenuItemCard', () => {
  const mockOnViewDetails = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders menu item information correctly', () => {
    render(
      <TestWrapper>
        <MenuItemCard item={mockMenuItem} onViewDetails={mockOnViewDetails} />
      </TestWrapper>
    );

    expect(screen.getByText('Signature Jollof Rice')).toBeInTheDocument();
    expect(screen.getByText(/Our famous Jollof rice cooked with aromatic spices/)).toBeInTheDocument();
    expect(screen.getByText('₦15')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Rice, Tomatoes, Onions...')).toBeInTheDocument();
  });

  it('displays correct emoji based on item category and name', () => {
    render(
      <TestWrapper>
        <MenuItemCard item={mockMenuItem} onViewDetails={mockOnViewDetails} />
      </TestWrapper>
    );

    // Should display rice emoji for main category
    expect(screen.getByText('🍚')).toBeInTheDocument();
  });

  it('handles quick add to cart', async () => {
    render(
      <TestWrapper>
        <MenuItemCard item={mockMenuItem} onViewDetails={mockOnViewDetails} />
      </TestWrapper>
    );

    const quickAddButton = screen.getByText('Quick Add');
    fireEvent.click(quickAddButton);

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith(expect.objectContaining({
        menuItemId: '1',
        name: 'Signature Jollof Rice',
        price: 1500,
        quantity: 1,
      }));
    });

    expect(toast.success).toHaveBeenCalledWith('Added Signature Jollof Rice to cart');
  });

  it('prevents quick add for unavailable items', async () => {
    render(
      <TestWrapper>
        <MenuItemCard item={unavailableMenuItem} onViewDetails={mockOnViewDetails} />
      </TestWrapper>
    );

    const quickAddButton = screen.getByText('Quick Add');
    expect(quickAddButton).toBeDisabled();

    fireEvent.click(quickAddButton);

    expect(mockAddItem).not.toHaveBeenCalled();
  });

  it('calls onViewDetails when clicking view details button', () => {
    render(
      <TestWrapper>
        <MenuItemCard item={mockMenuItem} onViewDetails={mockOnViewDetails} />
      </TestWrapper>
    );

    const detailsButton = screen.getByText('Details');
    fireEvent.click(detailsButton);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockMenuItem);
  });

  it('calls onViewDetails when clicking the card', () => {
    render(
      <TestWrapper>
        <MenuItemCard item={mockMenuItem} onViewDetails={mockOnViewDetails} />
      </TestWrapper>
    );

    const card = screen.getByText('Signature Jollof Rice').closest('.card');
    fireEvent.click(card!);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockMenuItem);
  });

  it('shows unavailable badge for unavailable items', () => {
    render(
      <TestWrapper>
        <MenuItemCard item={unavailableMenuItem} onViewDetails={mockOnViewDetails} />
      </TestWrapper>
    );

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Unavailable')).toHaveClass('badge-error');
  });

  it('handles showQuickAdd prop correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <MenuItemCard item={mockMenuItem} onViewDetails={mockOnViewDetails} showQuickAdd={false} />
      </TestWrapper>
    );

    // Should not show Quick Add button
    expect(screen.queryByText('Quick Add')).not.toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <MenuItemCard item={mockMenuItem} onViewDetails={mockOnViewDetails} showQuickAdd={true} />
      </TestWrapper>
    );

    // Should show Quick Add button
    expect(screen.getByText('Quick Add')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('handles add to cart error gracefully', async () => {
    mockAddItem.mockImplementation(() => {
      throw new Error('Cart error');
    });

    render(
      <TestWrapper>
        <MenuItemCard item={mockMenuItem} onViewDetails={mockOnViewDetails} />
      </TestWrapper>
    );

    const quickAddButton = screen.getByText('Quick Add');
    fireEvent.click(quickAddButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to add item to cart');
    });
  });

  it('truncates long descriptions correctly', () => {
    const longDescriptionItem: MenuItem = {
      ...mockMenuItem,
      description: 'This is a very long description that should be truncated when displayed in the card component to prevent the card from becoming too tall and maintain a consistent layout across all menu items in the grid.',
    };

    render(
      <TestWrapper>
        <MenuItemCard item={longDescriptionItem} onViewDetails={mockOnViewDetails} />
      </TestWrapper>
    );

    const description = screen.getByText(/This is a very long description/);
    expect(description).toHaveClass('line-clamp-3');
  });

  it('displays correct ingredient preview', () => {
    const manyIngredientsItem: MenuItem = {
      ...mockMenuItem,
      ingredients: ['Rice', 'Tomatoes', 'Onions', 'Spices', 'Bell Peppers', 'Garlic', 'Ginger'],
    };

    render(
      <TestWrapper>
        <MenuItemCard item={manyIngredientsItem} onViewDetails={mockOnViewDetails} />
      </TestWrapper>
    );

    // Should show first 3 ingredients with ellipsis
    expect(screen.getByText('Rice, Tomatoes, Onions...')).toBeInTheDocument();
  });
});