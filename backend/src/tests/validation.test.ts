import {
  menuItemSchema,
  createOrderSchema,
  paymentSchema,
  validateSchema,
  validateMenuItem,
  validateCustomerInfo,
  validateOrderItem,
  isValidUSPhone,
  isValidPrice,
} from '../lib/validation';

describe('Validation Schemas', () => {
  describe('menuItemSchema', () => {
    const validMenuItem = {
      name: 'Spiced Rice Bowl',
      description: 'Aromatic rice cooked with spices and vegetables',
      price: 1299,
      category: 'MAIN',
      imageUrl: 'https://example.com/spiced-rice.jpg',
      preparationTime: 15,
      ingredients: ['Rice', 'Tomatoes', 'Spices'],
      calories: 320,
    };

    it('should validate a valid menu item', () => {
      const { error, value } = validateSchema(menuItemSchema, validMenuItem);
      expect(error).toBeUndefined();
      expect(value).toEqual(validMenuItem);
    });

    it('should reject menu item with invalid price', () => {
      const invalidItem = { ...validMenuItem, price: -100 };
      const { error } = validateSchema(menuItemSchema, invalidItem);
      expect(error).toContain('must be greater than or equal to 1');
    });

    it('should reject menu item with invalid category', () => {
      const invalidItem = { ...validMenuItem, category: 'INVALID' };
      const { error } = validateSchema(menuItemSchema, invalidItem);
      expect(error).toContain('must be one of');
    });

    it('should reject menu item with empty ingredients', () => {
      const invalidItem = { ...validMenuItem, ingredients: [] };
      const { error } = validateSchema(menuItemSchema, invalidItem);
      expect(error).toContain('must contain at least 1 items');
    });
  });

  describe('createOrderSchema', () => {
    const validOrder = {
      customerInfo: {
        name: 'John Doe',
        phone: '+15551234567',
        email: 'john@example.com',
      },
      items: [
        {
          menuItemId: 'menu-item-1',
          quantity: 2,
          customizations: ['Extra spicy'],
        },
      ],
      orderType: 'PICKUP',
      specialInstructions: 'Please make it extra spicy',
    };

    it('should validate a valid pickup order', () => {
      const { error, value } = validateSchema(createOrderSchema, validOrder);
      expect(error).toBeUndefined();
      expect(value).toEqual(validOrder);
    });

    it('should validate a valid delivery order with address', () => {
      const deliveryOrder = {
        ...validOrder,
        orderType: 'DELIVERY',
        customerInfo: {
          ...validOrder.customerInfo,
          deliveryAddress: {
            street: '123 Main Street',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
          },
        },
      };

      const { error, value } = validateSchema(createOrderSchema, deliveryOrder);
      expect(error).toBeUndefined();
    });

    it('should reject order with invalid phone number', () => {
      const invalidOrder = {
        ...validOrder,
        customerInfo: {
          ...validOrder.customerInfo,
          phone: '123456789', // Invalid US phone
        },
      };

      const { error } = validateSchema(createOrderSchema, invalidOrder);
      expect(error).toContain('fails to match the required pattern');
    });

    it('should reject order with no items', () => {
      const invalidOrder = { ...validOrder, items: [] };
      const { error } = validateSchema(createOrderSchema, invalidOrder);
      expect(error).toContain('must contain at least 1 items');
    });

    it('should reject order with invalid quantity', () => {
      const invalidOrder = {
        ...validOrder,
        items: [{ ...validOrder.items[0], quantity: 0 }],
      };

      const { error } = validateSchema(createOrderSchema, invalidOrder);
      expect(error).toContain('must be greater than or equal to 1');
    });
  });

  describe('paymentSchema', () => {
    const validPayment = {
      orderId: 'order-123',
      method: 'CARD',
      amount: 2999,
      currency: 'USD',
    };

    it('should validate a valid payment', () => {
      const { error, value } = validateSchema(paymentSchema, validPayment);
      expect(error).toBeUndefined();
      expect(value).toEqual(validPayment);
    });

    it('should reject payment with invalid method', () => {
      const invalidPayment = { ...validPayment, method: 'INVALID' };
      const { error } = validateSchema(paymentSchema, invalidPayment);
      expect(error).toContain('must be one of');
    });

    it('should reject payment with invalid amount', () => {
      const invalidPayment = { ...validPayment, amount: 0 };
      const { error } = validateSchema(paymentSchema, invalidPayment);
      expect(error).toContain('must be greater than or equal to 1');
    });

    it('should default currency to USD', () => {
      const paymentWithoutCurrency: any = { ...validPayment };
      delete paymentWithoutCurrency.currency;

      const { error, value } = validateSchema(paymentSchema, paymentWithoutCurrency);
      expect(error).toBeUndefined();
      expect(value?.currency).toBe('USD');
    });

    it('should accept USD currency', () => {
      const usdPayment = { ...validPayment, currency: 'USD' };
      const { error, value } = validateSchema(paymentSchema, usdPayment);
      expect(error).toBeUndefined();
      expect(value?.currency).toBe('USD');
    });
  });

  describe('Data Model Validation Functions', () => {
    describe('validateMenuItem', () => {
      const validMenuItem = {
        name: 'Spiced Rice Bowl',
        description: 'Aromatic rice cooked with spices and vegetables',
        price: 1299,
        category: 'MAIN',
        imageUrl: 'https://example.com/spiced-rice.jpg',
        preparationTime: 15,
        ingredients: ['Rice', 'Tomatoes', 'Spices'],
      };

      it('should validate a valid menu item', () => {
        const result = validateMenuItem(validMenuItem);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject invalid menu item', () => {
        const invalidItem = { ...validMenuItem, price: -100 };
        const result = validateMenuItem(invalidItem);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validateCustomerInfo', () => {
      const validCustomer = {
        name: 'John Smith',
        phone: '+15551234567',
        email: 'john@example.com',
      };

      it('should validate valid customer info', () => {
        const result = validateCustomerInfo(validCustomer);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate customer with delivery address', () => {
        const customerWithAddress = {
          ...validCustomer,
          deliveryAddress: {
            street: '456 Oak Avenue',
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90210',
          },
        };

        const result = validateCustomerInfo(customerWithAddress);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject invalid phone number', () => {
        const invalidCustomer = { ...validCustomer, phone: '123456789' };
        const result = validateCustomerInfo(invalidCustomer);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validateOrderItem', () => {
      const validOrderItem = {
        menuItemId: 'menu-item-1',
        quantity: 2,
        unitPrice: 1299,
        customizations: ['Extra spicy'],
      };

      it('should validate valid order item', () => {
        const result = validateOrderItem(validOrderItem);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject invalid quantity', () => {
        const invalidItem = { ...validOrderItem, quantity: 0 };
        const result = validateOrderItem(invalidItem);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should reject invalid unit price', () => {
        const invalidItem = { ...validOrderItem, unitPrice: -100 };
        const result = validateOrderItem(invalidItem);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Helper Functions', () => {
    describe('isValidUSPhone', () => {
      it('should validate US phone numbers', () => {
        expect(isValidUSPhone('+15551234567')).toBe(true);
        expect(isValidUSPhone('5551234567')).toBe(true);
        expect(isValidUSPhone('2125551234')).toBe(true);
        expect(isValidUSPhone('3105551234')).toBe(true);
        expect(isValidUSPhone('7135551234')).toBe(true);
      });

      it('should reject invalid phone numbers', () => {
        expect(isValidUSPhone('123456789')).toBe(false);
        expect(isValidUSPhone('+2348012345678')).toBe(false);
        expect(isValidUSPhone('1551234567')).toBe(false); // Invalid area code starting with 1
        expect(isValidUSPhone('55512345678')).toBe(false); // Too long
        expect(isValidUSPhone('555123456')).toBe(false); // Too short
      });
    });

    describe('isValidPrice', () => {
      it('should validate positive integer prices', () => {
        expect(isValidPrice(1299)).toBe(true);
        expect(isValidPrice(1)).toBe(true);
        expect(isValidPrice(9999)).toBe(true);
      });

      it('should reject invalid prices', () => {
        expect(isValidPrice(0)).toBe(false);
        expect(isValidPrice(-100)).toBe(false);
        expect(isValidPrice(12.99)).toBe(false); // Not integer
        expect(isValidPrice(NaN)).toBe(false);
      });
    });
  });
});