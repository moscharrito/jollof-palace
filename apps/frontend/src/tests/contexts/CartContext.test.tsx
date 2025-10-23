import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { CartProvider, useCart } from '../../contexts/CartContext';

import { vi } from 'vitest';

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

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('provides initial empty cart state', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    expect(result.current.items).toEqual([]);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.getTotalItems()).toBe(0);
    expect(result.current.getSubtotal()).toBe(0);
    expect(result.current.getTax()).toBe(0);
    expect(result.current.getTotalPrice()).toBe(0);
    expect(result.current.getTotalWithTax()).toBe(0);
  });

  it('adds items to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const testItem = {
      id: '1',
      menuItemId: 'menu-1',
      name: 'Jollof Rice',
      price: 15.99,
      imageUrl: '/test.jpg',
    };
    
    act(() => {
      result.current.addItem(testItem);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      ...testItem,
      quantity: 1,
    });
    expect(result.current.getTotalItems()).toBe(1);
    expect(result.current.getSubtotal()).toBe(15.99);
    expect(result.current.getTax()).toBe(Math.round(15.99 * 0.0875));
    expect(result.current.getTotalPrice()).toBe(15.99 + Math.round(15.99 * 0.0875));
  });

  it('updates quantity when adding existing item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const testItem = {
      id: '1',
      menuItemId: 'menu-1',
      name: 'Jollof Rice',
      price: 15.99,
      imageUrl: '/test.jpg',
    };
    
    act(() => {
      result.current.addItem(testItem);
      result.current.addItem(testItem);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.getTotalItems()).toBe(2);
    expect(result.current.getSubtotal()).toBe(31.98);
    expect(result.current.getTax()).toBe(Math.round(31.98 * 0.0875));
    expect(result.current.getTotalPrice()).toBe(31.98 + Math.round(31.98 * 0.0875));
  });

  it('removes items from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const testItem = {
      id: '1',
      menuItemId: 'menu-1',
      name: 'Jollof Rice',
      price: 15.99,
      imageUrl: '/test.jpg',
    };
    
    act(() => {
      result.current.addItem(testItem);
    });
    
    expect(result.current.items).toHaveLength(1);
    
    act(() => {
      result.current.removeItem('1');
    });
    
    expect(result.current.items).toHaveLength(0);
  });

  it('updates item quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const testItem = {
      id: '1',
      menuItemId: 'menu-1',
      name: 'Jollof Rice',
      price: 15.99,
      imageUrl: '/test.jpg',
    };
    
    act(() => {
      result.current.addItem(testItem);
    });
    
    act(() => {
      result.current.updateQuantity('1', 3);
    });
    
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.getTotalItems()).toBe(3);
  });

  it('removes item when quantity is set to 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const testItem = {
      id: '1',
      menuItemId: 'menu-1',
      name: 'Jollof Rice',
      price: 15.99,
      imageUrl: '/test.jpg',
    };
    
    act(() => {
      result.current.addItem(testItem);
    });
    
    act(() => {
      result.current.updateQuantity('1', 0);
    });
    
    expect(result.current.items).toHaveLength(0);
  });

  it('clears entire cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const testItem = {
      id: '1',
      menuItemId: 'menu-1',
      name: 'Jollof Rice',
      price: 15.99,
      imageUrl: '/test.jpg',
    };
    
    act(() => {
      result.current.addItem(testItem);
    });
    
    expect(result.current.items).toHaveLength(1);
    
    act(() => {
      result.current.clearCart();
    });
    
    expect(result.current.items).toHaveLength(0);
  });

  it('toggles cart open/close state', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    expect(result.current.isOpen).toBe(false);
    
    act(() => {
      result.current.toggleCart();
    });
    
    expect(result.current.isOpen).toBe(true);
    
    act(() => {
      result.current.toggleCart();
    });
    
    expect(result.current.isOpen).toBe(false);
  });

  it('gets item quantity by menu item id', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const testItem = {
      id: '1',
      menuItemId: 'menu-1',
      name: 'Jollof Rice',
      price: 15.99,
      imageUrl: '/test.jpg',
    };
    
    expect(result.current.getItemQuantity('menu-1')).toBe(0);
    
    act(() => {
      result.current.addItem(testItem);
    });
    
    expect(result.current.getItemQuantity('menu-1')).toBe(1);
  });

  it('calculates tax correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const testItem = {
      id: '1',
      menuItemId: 'menu-1',
      name: 'Jollof Rice',
      price: 2000, // $20.00
      imageUrl: '/test.jpg',
    };
    
    act(() => {
      result.current.addItem(testItem);
    });
    
    const expectedTax = Math.round(2000 * 0.0875); // 8.75% tax
    expect(result.current.getTax()).toBe(expectedTax);
    expect(result.current.getTotalPrice()).toBe(2000 + expectedTax);
    expect(result.current.getTotalWithTax()).toBe(2000 + expectedTax);
  });

  it('calculates tax for multiple items correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const item1 = {
      id: '1',
      menuItemId: 'menu-1',
      name: 'Jollof Rice',
      price: 1500, // $15.00
      imageUrl: '/test.jpg',
    };
    
    const item2 = {
      id: '2',
      menuItemId: 'menu-2',
      name: 'Pepper Chicken',
      price: 2500, // $25.00
      imageUrl: '/test2.jpg',
    };
    
    act(() => {
      result.current.addItem(item1);
      result.current.addItem(item2);
    });
    
    const subtotal = 4000; // $40.00
    const expectedTax = Math.round(subtotal * 0.0875);
    
    expect(result.current.getSubtotal()).toBe(subtotal);
    expect(result.current.getTax()).toBe(expectedTax);
    expect(result.current.getTotalPrice()).toBe(subtotal + expectedTax);
  });

  it('updates tax calculation when quantities change', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const testItem = {
      id: '1',
      menuItemId: 'menu-1',
      name: 'Jollof Rice',
      price: 1000, // $10.00
      imageUrl: '/test.jpg',
    };
    
    act(() => {
      result.current.addItem(testItem);
    });
    
    // Initial tax calculation
    let expectedTax = Math.round(1000 * 0.0875);
    expect(result.current.getTax()).toBe(expectedTax);
    
    // Update quantity to 3
    act(() => {
      result.current.updateQuantity('1', 3);
    });
    
    // Tax should update based on new subtotal
    expectedTax = Math.round(3000 * 0.0875);
    expect(result.current.getSubtotal()).toBe(3000);
    expect(result.current.getTax()).toBe(expectedTax);
    expect(result.current.getTotalPrice()).toBe(3000 + expectedTax);
  });

  it('persists cart to localStorage', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const testItem = {
      id: '1',
      menuItemId: 'menu-1',
      name: 'Jollof Rice',
      price: 15.99,
      imageUrl: '/test.jpg',
    };
    
    act(() => {
      result.current.addItem(testItem);
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'jollof-palace-cart',
      expect.stringContaining('Jollof Rice')
    );
  });
});