import { render, screen } from '@testing-library/react';
import OrderReview from '../../components/checkout/OrderReview';
import { CustomerInfo } from '@food-ordering/shared';
import { CartItem } from '../../contexts/CartContext';

describe('OrderReview', () => {
  const mockItems: CartItem[] = [
    {
      id: '1',
      menuItemId: 'jollof-chicken',
      name: 'Jollof Rice with Pepper Chicken',
      price: 1500,
      quantity: 2,
      imageUrl: '/images/jollof-chicken.jpg',
      customizations: ['Extra spicy'],
    },
    {
      id: '2',
      menuItemId: 'dodo',
      name: 'Dodo (Fried Plantain)',
      price: 800,
      quantity: 1,
      imageUrl: '/images/dodo.jpg',
    },
  ];

  const mockCustomerInfo: CustomerInfo = {
    name: 'John Doe',
    phone: '1234567890',
    email: 'john@example.com',
    deliveryAddress: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      landmark: 'Near Central Park',
    },
  };

  const defaultProps = {
    items: mockItems,
    customerInfo: mockCustomerInfo,
    orderType: 'delivery' as const,
    specialInstructions: 'Please ring the doorbell',
    subtotal: 3800,
    tax: 333,
    deliveryFee: 500,
    total: 4633,
  };

  it('should render order items with correct details', () => {
    render(<OrderReview {...defaultProps} />);

    expect(screen.getByText('Order Items (2 items)')).toBeInTheDocument();
    expect(screen.getByText('Jollof Rice with Pepper Chicken')).toBeInTheDocument();
    expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
    expect(screen.getByText('Customizations: Extra spicy')).toBeInTheDocument();
    expect(screen.getByText('Dodo (Fried Plantain)')).toBeInTheDocument();
    expect(screen.getByText('Quantity: 1')).toBeInTheDocument();
  });

  it('should display correct pricing for items', () => {
    render(<OrderReview {...defaultProps} />);

    // Check individual item prices
    expect(screen.getByText('$30.00')).toBeInTheDocument(); // 1500 * 2 / 100
    expect(screen.getByText('$15.00 each')).toBeInTheDocument(); // 1500 / 100
    expect(screen.getByText('$8.00')).toBeInTheDocument(); // 800 / 100
    expect(screen.getByText('$8.00 each')).toBeInTheDocument(); // 800 / 100
  });

  it('should render customer information correctly', () => {
    render(<OrderReview {...defaultProps} />);

    expect(screen.getByText('Customer Information')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('(123) 456-7890')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should not show email if not provided', () => {
    const propsWithoutEmail = {
      ...defaultProps,
      customerInfo: {
        ...mockCustomerInfo,
        email: undefined,
      },
    };

    render(<OrderReview {...propsWithoutEmail} />);

    expect(screen.queryByText('Email:')).not.toBeInTheDocument();
  });

  it('should render delivery information correctly', () => {
    render(<OrderReview {...defaultProps} />);

    expect(screen.getByText('Delivery Information')).toBeInTheDocument();
    expect(screen.getByText(/delivery.*🚚/i)).toBeInTheDocument();
    expect(screen.getByText('30-45 minutes')).toBeInTheDocument();
    expect(screen.getByText('Delivery Address:')).toBeInTheDocument();
    expect(screen.getByText('123 Main Street')).toBeInTheDocument();
    expect(screen.getByText('New York, NY 10001')).toBeInTheDocument();
    expect(screen.getByText('Landmark: Near Central Park')).toBeInTheDocument();
  });

  it('should render pickup information correctly', () => {
    const pickupProps = {
      ...defaultProps,
      orderType: 'pickup' as const,
      deliveryFee: 0,
      total: 4133,
    };

    render(<OrderReview {...pickupProps} />);

    expect(screen.getByText('Pickup Information')).toBeInTheDocument();
    expect(screen.getByText(/pickup.*🏪/i)).toBeInTheDocument();
    expect(screen.getByText('15-20 minutes')).toBeInTheDocument();
    expect(screen.getByText('Pickup Location:')).toBeInTheDocument();
    expect(screen.getByText('Jollof Palace Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Please bring your order confirmation')).toBeInTheDocument();
  });

  it('should not show delivery address for pickup orders', () => {
    const pickupProps = {
      ...defaultProps,
      orderType: 'pickup' as const,
    };

    render(<OrderReview {...pickupProps} />);

    expect(screen.queryByText('Delivery Address:')).not.toBeInTheDocument();
    expect(screen.queryByText('123 Main Street')).not.toBeInTheDocument();
  });

  it('should render special instructions when provided', () => {
    render(<OrderReview {...defaultProps} />);

    expect(screen.getByText('Special Instructions')).toBeInTheDocument();
    expect(screen.getByText('Please ring the doorbell')).toBeInTheDocument();
  });

  it('should not render special instructions section when empty', () => {
    const propsWithoutInstructions = {
      ...defaultProps,
      specialInstructions: '',
    };

    render(<OrderReview {...propsWithoutInstructions} />);

    expect(screen.queryByText('Special Instructions')).not.toBeInTheDocument();
  });

  it('should render order total breakdown correctly', () => {
    render(<OrderReview {...defaultProps} />);

    expect(screen.getByText('Order Total')).toBeInTheDocument();
    expect(screen.getByText('Subtotal:')).toBeInTheDocument();
    expect(screen.getByText('$38.00')).toBeInTheDocument(); // 3800 / 100
    expect(screen.getByText('Tax (8.75%):')).toBeInTheDocument();
    expect(screen.getByText('$3.33')).toBeInTheDocument(); // 333 / 100
    expect(screen.getByText('Delivery Fee:')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument(); // 500 / 100
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('$46.33')).toBeInTheDocument(); // 4633 / 100
  });

  it('should show free delivery message when delivery fee is 0', () => {
    const freeDeliveryProps = {
      ...defaultProps,
      deliveryFee: 0,
      total: 4133,
    };

    render(<OrderReview {...freeDeliveryProps} />);

    expect(screen.getByText('(Free!)')).toBeInTheDocument();
  });

  it('should show pickup instead of delivery fee for pickup orders', () => {
    const pickupProps = {
      ...defaultProps,
      orderType: 'pickup' as const,
      deliveryFee: 0,
      total: 4133,
    };

    render(<OrderReview {...pickupProps} />);

    expect(screen.getByText('Pickup:')).toBeInTheDocument();
    expect(screen.queryByText('Delivery Fee:')).not.toBeInTheDocument();
  });

  it('should render payment information', () => {
    render(<OrderReview {...defaultProps} />);

    expect(screen.getByText('Payment:')).toBeInTheDocument();
    expect(screen.getByText(/You will be redirected to our secure payment processor/)).toBeInTheDocument();
  });

  it('should handle single item correctly', () => {
    const singleItemProps = {
      ...defaultProps,
      items: [mockItems[0]],
    };

    render(<OrderReview {...singleItemProps} />);

    expect(screen.getByText('Order Items (1 item)')).toBeInTheDocument();
  });

  it('should not show customizations if none exist', () => {
    const itemsWithoutCustomizations = [
      {
        ...mockItems[0],
        customizations: undefined,
      },
    ];

    const propsWithoutCustomizations = {
      ...defaultProps,
      items: itemsWithoutCustomizations,
    };

    render(<OrderReview {...propsWithoutCustomizations} />);

    expect(screen.queryByText('Customizations:')).not.toBeInTheDocument();
  });

  it('should not show landmark if not provided', () => {
    const customerInfoWithoutLandmark = {
      ...mockCustomerInfo,
      deliveryAddress: {
        ...mockCustomerInfo.deliveryAddress!,
        landmark: undefined,
      },
    };

    const propsWithoutLandmark = {
      ...defaultProps,
      customerInfo: customerInfoWithoutLandmark,
    };

    render(<OrderReview {...propsWithoutLandmark} />);

    expect(screen.queryByText('Landmark:')).not.toBeInTheDocument();
  });
});