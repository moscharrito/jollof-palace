import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import CartItem from '../../components/cart/CartItem';
import { CartItem as CartItemType } from '../../contexts/CartContext';

const mockFormatPrice = (priceInCents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(priceInCents / 100);
};

const mockCartItem: CartItemType = {
  id: '1',
  menuItemId: 'menu-1',
  name: 'Jollof Rice with Chicken',
  price: 2500, // $25.00
  quantity: 2,
  imageUrl: '/test.jpg',
  customizations: ['Extra Spicy', 'No Onions'],
};

describe('CartItem', () => {
  const mockOnUpdateQuantity = vi.fn();
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cart item with correct information', () => {
    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        formatPrice={mockFormatPrice}
      />
    );

    expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();
    expect(screen.getByText('$25.00 each')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // quantity
    expect(screen.getByText('$50.00')).toBeInTheDocument(); // total price
  });

  it('displays customizations when present', () => {
    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        formatPrice={mockFormatPrice}
      />
    );

    expect(screen.getByText('Customizations:')).toBeInTheDocument();
    expect(screen.getByText('Extra Spicy, No Onions')).toBeInTheDocument();
  });

  it('does not display customizations section when none exist', () => {
    const itemWithoutCustomizations = {
      ...mockCartItem,
      customizations: undefined,
    };

    render(
      <CartItem
        item={itemWithoutCustomizations}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        formatPrice={mockFormatPrice}
      />
    );

    expect(screen.queryByText('Customizations:')).not.toBeInTheDocument();
  });

  it('calls onUpdateQuantity when increase button is clicked', () => {
    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        formatPrice={mockFormatPrice}
      />
    );

    const increaseButton = screen.getByLabelText('Increase quantity');
    fireEvent.click(increaseButton);

    expect(mockOnUpdateQuantity).toHaveBeenCalledWith('1', 3);
  });

  it('calls onUpdateQuantity when decrease button is clicked', () => {
    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        formatPrice={mockFormatPrice}
      />
    );

    const decreaseButton = screen.getByLabelText('Decrease quantity');
    fireEvent.click(decreaseButton);

    expect(mockOnUpdateQuantity).toHaveBeenCalledWith('1', 1);
  });

  it('disables decrease button when quantity is 1', () => {
    const itemWithQuantityOne = {
      ...mockCartItem,
      quantity: 1,
    };

    render(
      <CartItem
        item={itemWithQuantityOne}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        formatPrice={mockFormatPrice}
      />
    );

    const decreaseButton = screen.getByLabelText('Decrease quantity');
    expect(decreaseButton).toBeDisabled();
  });

  it('calls onRemove when remove button is clicked', () => {
    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        formatPrice={mockFormatPrice}
      />
    );

    const removeButton = screen.getByLabelText('Remove Jollof Rice with Chicken from cart');
    fireEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledWith('1');
  });

  it('displays correct emoji for different food types', () => {
    const jollofItem = { ...mockCartItem, name: 'Jollof Rice' };
    const chickenItem = { ...mockCartItem, name: 'Pepper Chicken' };
    const fishItem = { ...mockCartItem, name: 'Pepper Fish' };
    const beefItem = { ...mockCartItem, name: 'Pepper Beef' };
    const goatItem = { ...mockCartItem, name: 'Pepper Goat' };
    const dodoItem = { ...mockCartItem, name: 'Dodo' };

    // Test Jollof Rice emoji
    const { rerender } = render(
      <CartItem
        item={jollofItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        formatPrice={mockFormatPrice}
      />
    );
    expect(screen.getByText('🍚')).toBeInTheDocument();

    // Test Chicken emoji
    rerender(
      <CartItem
        item={chickenItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        formatPrice={mockFormatPrice}
      />
    );
    expect(screen.getByText('🍗')).toBeInTheDocument();

    // Test Fish emoji
    rerender(
      <CartItem
        item={fishItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        formatPrice={mockFormatPrice}
      />
    );
    expect(screen.getByText('🐟')).toBeInTheDocument();

    // Test Beef emoji
    rerender(
      <CartItem
        item={beefItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        formatPrice={mockFormatPrice}
      />
    );
    expect(screen.getByText('🥩')).toBeInTheDocument();

    // Test Goat emoji
    rerender(
      <CartItem
        item={goatItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        formatPrice={mockFormatPrice}
      />
    );
    expect(screen.getByText('🐐')).toBeInTheDocument();

    // Test default emoji (Dodo/plantain)
    rerender(
      <CartItem
        item={dodoItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        formatPrice={mockFormatPrice}
      />
    );
    expect(screen.getByText('🍌')).toBeInTheDocument();
  });
});