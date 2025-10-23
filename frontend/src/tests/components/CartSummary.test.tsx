import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import CartSummary from '../../components/cart/CartSummary';
import { CartProvider } from '../../contexts/CartContext';

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
(global as any).localStorage = localStorageMock;

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <CartProvider>
      {component}
    </CartProvider>
  );
};

describe('CartSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders nothing when cart is empty', () => {
    const { container } = renderWithProvider(<CartSummary />);
    expect(container.firstChild).toBeNull();
  });

  it('displays order summary with correct calculations', () => {
    // Pre-populate localStorage with cart data
    const cartData = [
      {
        id: '1',
        menuItemId: 'menu-1',
        name: 'Jollof Rice',
        price: 2000, // $20.00
        quantity: 2,
        imageUrl: '/test.jpg',
      }
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(cartData));
    
    renderWithProvider(<CartSummary />);
    
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText('Subtotal (2 items)')).toBeInTheDocument();
    expect(screen.getByText('$40.00')).toBeInTheDocument(); // Subtotal
    expect(screen.getByText('Tax (8.75%)')).toBeInTheDocument();
    expect(screen.getByText('$3.50')).toBeInTheDocument(); // Tax
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$43.50')).toBeInTheDocument(); // Total
  });

  it('shows delivery fee when enabled and below threshold', () => {
    const cartData = [
      {
        id: '1',
        menuItemId: 'menu-1',
        name: 'Jollof Rice',
        price: 1000, // $10.00
        quantity: 1,
        imageUrl: '/test.jpg',
      }
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(cartData));
    
    renderWithProvider(
      <CartSummary 
        showDeliveryFee={true}
        deliveryFeeThreshold={2000}
        deliveryFee={500}
      />
    );
    
    expect(screen.getByText('Delivery Fee')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument(); // Delivery fee
    expect(screen.getByText(/Add \$10\.00 more for free delivery!/)).toBeInTheDocument();
  });

  it('shows free delivery when above threshold', () => {
    const cartData = [
      {
        id: '1',
        menuItemId: 'menu-1',
        name: 'Jollof Rice',
        price: 3000, // $30.00
        quantity: 1,
        imageUrl: '/test.jpg',
      }
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(cartData));
    
    renderWithProvider(
      <CartSummary 
        showDeliveryFee={true}
        deliveryFeeThreshold={2500}
        deliveryFee={500}
      />
    );
    
    expect(screen.getByText('Delivery Fee')).toBeInTheDocument();
    expect(screen.getByText('(Free!)')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument(); // Free delivery
  });

  it('handles single item correctly', () => {
    const cartData = [
      {
        id: '1',
        menuItemId: 'menu-1',
        name: 'Jollof Rice',
        price: 1500, // $15.00
        quantity: 1,
        imageUrl: '/test.jpg',
      }
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(cartData));
    
    renderWithProvider(<CartSummary />);
    
    expect(screen.getByText('Subtotal (1 item)')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const cartData = [
      {
        id: '1',
        menuItemId: 'menu-1',
        name: 'Jollof Rice',
        price: 1000,
        quantity: 1,
        imageUrl: '/test.jpg',
      }
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(cartData));
    
    const { container } = renderWithProvider(
      <CartSummary className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});