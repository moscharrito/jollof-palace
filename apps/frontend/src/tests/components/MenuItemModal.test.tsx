import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { MenuItem } from '@food-ordering/shared';
import MenuItemModal from '../../components/menu/MenuItemModal';
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
  nutritionalInfo: {
    calories: 450,
    protein: 12,
    carbs: 85,
    fat: 8,
    fiber: 3,
    sodium: 800,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
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

describe('MenuItemModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document body overflow
    document.body.style.overflow = 'unset';
  });

  it('renders modal content when open', () => {
    render(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText('Signature Jollof Rice')).toBeInTheDocument();
    expect(screen.getByText(/Our famous Jollof rice cooked with aromatic spices/)).toBeInTheDocument();
    expect(screen.getByText('15 minutes')).toBeInTheDocument();
    expect(screen.getByText('Rice, Tomatoes, Onions, Spices')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={false} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.queryByText('Signature Jollof Rice')).not.toBeInTheDocument();
  });

  it('does not render when item is null', () => {
    render(
      <TestWrapper>
        <MenuItemModal item={null} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.queryByText('Signature Jollof Rice')).not.toBeInTheDocument();
  });

  it('displays nutritional information when available', () => {
    render(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText('Nutritional Information')).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument(); // Calories
    expect(screen.getByText('12g')).toBeInTheDocument(); // Protein
    expect(screen.getByText('85g')).toBeInTheDocument(); // Carbs
  });

  it('handles quantity changes correctly', () => {
    render(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const decreaseButton = buttons[1]; // Second button (after close)
    const increaseButton = buttons[2]; // Third button

    // Initial quantity should be 1
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('₦15')).toBeInTheDocument(); // Total price

    // Increase quantity
    fireEvent.click(increaseButton);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('₦30')).toBeInTheDocument(); // Updated total

    // Decrease quantity
    fireEvent.click(decreaseButton);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('₦15')).toBeInTheDocument();

    // Decrease button should be disabled at quantity 1
    expect(decreaseButton).toBeDisabled();
  });

  it('handles customization selection', () => {
    render(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Should show customization options for Jollof rice
    expect(screen.getByText('Customizations')).toBeInTheDocument();
    expect(screen.getByText('Extra Spicy')).toBeInTheDocument();
    expect(screen.getByText('Mild Spice')).toBeInTheDocument();

    // Select a customization
    const extraSpicyCheckbox = screen.getByLabelText('Extra Spicy');
    fireEvent.click(extraSpicyCheckbox);
    expect(extraSpicyCheckbox).toBeChecked();

    // Unselect customization
    fireEvent.click(extraSpicyCheckbox);
    expect(extraSpicyCheckbox).not.toBeChecked();
  });

  it('handles special instructions input', () => {
    render(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const instructionsTextarea = screen.getByPlaceholderText(/Any special requests/);
    fireEvent.change(instructionsTextarea, { target: { value: 'No onions please' } });

    expect(instructionsTextarea).toHaveValue('No onions please');
    expect(screen.getByText('15/200 characters')).toBeInTheDocument();
  });

  it('adds item to cart with correct parameters', async () => {
    render(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Set quantity to 2
    const increaseButton = screen.getAllByRole('button')[2]; // Third button (after close and decrease)
    fireEvent.click(increaseButton);

    // Select customization
    const extraSpicyCheckbox = screen.getByLabelText('Extra Spicy');
    fireEvent.click(extraSpicyCheckbox);

    // Add special instructions
    const instructionsTextarea = screen.getByPlaceholderText(/Any special requests/);
    fireEvent.change(instructionsTextarea, { target: { value: 'Extra sauce' } });

    // Add to cart
    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith(expect.objectContaining({
        menuItemId: '1',
        name: 'Signature Jollof Rice',
        price: 1500,
        quantity: 2,
        customizations: ['Extra Spicy'],
      }));
    });

    expect(toast.success).toHaveBeenCalledWith('Added 2 Signature Jollof Rices to cart');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes modal when clicking close button', () => {
    render(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes modal when clicking backdrop', () => {
    render(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const backdrop = document.querySelector('.bg-black.bg-opacity-50');
    fireEvent.click(backdrop!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes modal on escape key press', () => {
    render(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('prevents body scroll when modal is open', () => {
    render(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when modal closes', () => {
    const { rerender } = render(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={false} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(document.body.style.overflow).toBe('unset');
  });

  it('disables add to cart for unavailable items', () => {
    const unavailableItem = { ...mockMenuItem, isAvailable: false };

    render(
      <TestWrapper>
        <MenuItemModal item={unavailableItem} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const addToCartButton = screen.getByText('Currently Unavailable');
    expect(addToCartButton).toBeDisabled();
  });

  it('handles add to cart error gracefully', async () => {
    mockAddItem.mockImplementation(() => {
      throw new Error('Cart error');
    });

    render(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to add item to cart');
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('resets state when modal opens with different item', () => {
    const { rerender } = render(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Change quantity and add customization
    const increaseButton = screen.getAllByRole('button')[2]; // Third button
    fireEvent.click(increaseButton);
    
    const extraSpicyCheckbox = screen.getByLabelText('Extra Spicy');
    fireEvent.click(extraSpicyCheckbox);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(extraSpicyCheckbox).toBeChecked();

    // Close and reopen with same item
    rerender(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={false} onClose={mockOnClose} />
      </TestWrapper>
    );

    rerender(
      <TestWrapper>
        <MenuItemModal item={mockMenuItem} isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // State should be reset
    expect(screen.getByText('1')).toBeInTheDocument();
    const resetExtraSpicyCheckbox = screen.getByLabelText('Extra Spicy');
    expect(resetExtraSpicyCheckbox).not.toBeChecked();
  });
});