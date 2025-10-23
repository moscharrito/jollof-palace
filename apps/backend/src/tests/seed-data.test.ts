import { validateMenuItem, validateCustomerInfo, isValidUSPhone, isValidPrice } from '../lib/validation';

describe('Seed Data Validation', () => {
  describe('Menu Items Data Structure', () => {
    const menuItems = [
      {
        name: 'Spiced Rice Bowl',
        description: 'Aromatic rice cooked with a blend of spices, tomatoes, and peppers. A flavorful and satisfying dish!',
        price: 1299, // $12.99 in cents
        category: 'MAIN' as const,
        imageUrl: 'https://example.com/images/spiced-rice.jpg',
        preparationTime: 15,
        ingredients: ['Rice', 'Tomatoes', 'Bell Peppers', 'Onions', 'Spices', 'Vegetable Stock'],
        calories: 320,
        protein: 8.5,
        carbs: 65.2,
        fat: 4.1,
        fiber: 2.3,
      },
      {
        name: 'Spicy Grilled Chicken',
        description: 'Tender grilled chicken marinated in our signature spice blend. Bold flavors that pack a punch!',
        price: 1699, // $16.99 in cents
        category: 'MAIN' as const,
        imageUrl: 'https://example.com/images/spicy-chicken.jpg',
        preparationTime: 20,
        ingredients: ['Chicken', 'Jalapeño Peppers', 'Ginger', 'Garlic', 'Onions', 'Spice Blend'],
        calories: 285,
        protein: 32.1,
        carbs: 3.2,
        fat: 15.8,
        fiber: 0.5,
      },
      {
        name: 'Spicy Beef Stir-Fry',
        description: 'Succulent beef strips stir-fried with peppers and our signature spicy sauce. A protein-packed favorite!',
        price: 1899, // $18.99 in cents
        category: 'MAIN' as const,
        imageUrl: 'https://example.com/images/spicy-beef.jpg',
        preparationTime: 25,
        ingredients: ['Beef', 'Bell Peppers', 'Jalapeños', 'Tomatoes', 'Onions', 'Garlic', 'Ginger'],
        calories: 340,
        protein: 28.5,
        carbs: 5.1,
        fat: 22.3,
        fiber: 1.2,
      },
      {
        name: 'Cajun Spiced Lamb',
        description: 'Premium lamb cuts seasoned with traditional Cajun spices. A bold and adventurous choice!',
        price: 2299, // $22.99 in cents
        category: 'MAIN' as const,
        imageUrl: 'https://example.com/images/cajun-lamb.jpg',
        preparationTime: 30,
        ingredients: ['Lamb', 'Cajun Spice Mix', 'Traditional Herbs', 'Onions', 'Garlic', 'Ginger'],
        calories: 310,
        protein: 26.8,
        carbs: 2.8,
        fat: 20.5,
        fiber: 0.8,
      },
      {
        name: 'Blackened Fish',
        description: 'Fresh fish fillet blackened with our special spice rub. Light, flaky, and full of flavor!',
        price: 1799, // $17.99 in cents
        category: 'MAIN' as const,
        imageUrl: 'https://example.com/images/blackened-fish.jpg',
        preparationTime: 18,
        ingredients: ['Fresh Fish', 'Blackening Spices', 'Lemon', 'Herbs', 'Garlic', 'Ginger'],
        calories: 220,
        protein: 35.2,
        carbs: 2.1,
        fat: 8.5,
        fiber: 0.3,
      },
      {
        name: 'Sweet Potato Fries',
        description: 'Crispy sweet potato fries seasoned with our signature spice blend. The perfect side dish!',
        price: 699, // $6.99 in cents
        category: 'SIDE' as const,
        imageUrl: 'https://example.com/images/sweet-potato-fries.jpg',
        preparationTime: 10,
        ingredients: ['Sweet Potatoes', 'Olive Oil', 'Sea Salt', 'Spice Blend'],
        calories: 180,
        protein: 1.8,
        carbs: 38.5,
        fat: 5.2,
        fiber: 3.1,
      },
      {
        name: 'Spiced Rice + Grilled Chicken Combo',
        description: 'Our signature spiced rice paired with tender grilled chicken. The ultimate comfort meal!',
        price: 2199, // $21.99 in cents (discounted from $24.98)
        category: 'COMBO' as const,
        imageUrl: 'https://example.com/images/rice-chicken-combo.jpg',
        preparationTime: 25,
        ingredients: ['Spiced Rice', 'Grilled Chicken', 'Side Salad'],
        calories: 605,
        protein: 40.6,
        carbs: 68.4,
        fat: 19.9,
        fiber: 2.8,
      },
      {
        name: 'Rice Bowl + Sweet Potato Fries Combo',
        description: 'Classic spiced rice with crispy sweet potato fries. A delicious vegetarian-friendly option!',
        price: 1599, // $15.99 in cents (discounted from $19.98)
        category: 'COMBO' as const,
        imageUrl: 'https://example.com/images/rice-fries-combo.jpg',
        preparationTime: 20,
        ingredients: ['Spiced Rice', 'Sweet Potato Fries', 'Dipping Sauce'],
        calories: 500,
        protein: 10.3,
        carbs: 103.7,
        fat: 9.3,
        fiber: 5.4,
      },
    ];

    it('should validate all menu items according to requirements 2.1, 2.2, 2.3', () => {
      menuItems.forEach((item, index) => {
        const result = validateMenuItem(item);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        
        // Verify specific requirements
        expect(item.name).toBeDefined();
        expect(item.description.length).toBeGreaterThan(10);
        expect(isValidPrice(item.price)).toBe(true);
        expect(['MAIN', 'SIDE', 'COMBO']).toContain(item.category);
        expect(item.ingredients.length).toBeGreaterThan(0);
        expect(item.preparationTime).toBeGreaterThan(0);
      });
    });

    it('should include all required menu items', () => {
      const itemNames = menuItems.map(item => item.name);
      
      // Requirement 2.1: Core menu items
      expect(itemNames).toContain('Spiced Rice Bowl');
      expect(itemNames).toContain('Spicy Grilled Chicken');
      expect(itemNames).toContain('Spicy Beef Stir-Fry');
      expect(itemNames).toContain('Cajun Spiced Lamb');
      expect(itemNames).toContain('Blackened Fish');
      expect(itemNames).toContain('Sweet Potato Fries');
    });

    it('should have proper US pricing in cents', () => {
      menuItems.forEach(item => {
        // All prices should be in cents (integers)
        expect(Number.isInteger(item.price)).toBe(true);
        expect(item.price).toBeGreaterThan(0);
        
        // Reasonable price ranges for US context
        expect(item.price).toBeGreaterThanOrEqual(500); // At least $5.00
        expect(item.price).toBeLessThanOrEqual(5000); // At most $50.00
      });
    });

    it('should have appropriate preparation times', () => {
      menuItems.forEach(item => {
        expect(item.preparationTime).toBeGreaterThan(0);
        expect(item.preparationTime).toBeLessThanOrEqual(60); // Max 1 hour
      });
    });

    it('should have nutritional information', () => {
      menuItems.forEach(item => {
        expect(item.calories).toBeGreaterThan(0);
        expect(item.protein).toBeGreaterThanOrEqual(0);
        expect(item.carbs).toBeGreaterThanOrEqual(0);
        expect(item.fat).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('System Settings Data Structure', () => {
    const systemSettings = [
      { key: 'restaurant_name', value: 'Spice Kitchen' },
      { key: 'restaurant_phone', value: '+1-555-123-4567' },
      { key: 'restaurant_address', value: '123 Main Street, New York, NY 10001' },
      { key: 'tax_rate', value: '0.08' }, // 8% sales tax (typical US rate)
      { key: 'delivery_fee', value: '299' }, // $2.99 in cents
      { key: 'minimum_order', value: '1500' }, // $15.00 in cents
      { key: 'operating_hours', value: '{"open": "11:00", "close": "22:00"}' },
      { key: 'is_open', value: 'true' },
      { key: 'currency', value: 'USD' },
      { key: 'timezone', value: 'America/New_York' },
    ];

    it('should have valid US context settings', () => {
      const settingsMap = new Map(systemSettings.map(s => [s.key, s.value]));
      
      expect(settingsMap.get('restaurant_name')).toBe('Spice Kitchen');
      expect(settingsMap.get('currency')).toBe('USD');
      expect(settingsMap.get('timezone')).toBe('America/New_York');
      expect(settingsMap.get('restaurant_address')).toContain('New York, NY');
    });

    it('should have valid US phone number', () => {
      const phone = systemSettings.find(s => s.key === 'restaurant_phone')?.value;
      expect(phone).toBeDefined();
      expect(isValidUSPhone(phone!.replace(/-/g, ''))).toBe(true);
    });

    it('should have valid tax rate for US', () => {
      const taxRate = parseFloat(systemSettings.find(s => s.key === 'tax_rate')?.value || '0');
      expect(taxRate).toBe(0.08); // 8% sales tax
    });

    it('should have reasonable delivery fee and minimum order', () => {
      const deliveryFee = parseInt(systemSettings.find(s => s.key === 'delivery_fee')?.value || '0');
      const minimumOrder = parseInt(systemSettings.find(s => s.key === 'minimum_order')?.value || '0');
      
      expect(deliveryFee).toBe(299); // $2.99
      expect(minimumOrder).toBe(1500); // $15.00
      expect(isValidPrice(deliveryFee)).toBe(true);
      expect(isValidPrice(minimumOrder)).toBe(true);
    });
  });

  describe('Sample Customer Data Validation', () => {
    const sampleCustomers = [
      {
        name: 'John Smith',
        phone: '+15551234567',
        email: 'john@example.com',
      },
      {
        name: 'Sarah Johnson',
        phone: '2125551234',
        email: 'sarah@gmail.com',
        deliveryAddress: {
          street: '456 Oak Avenue',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90210',
        },
      },
      {
        name: 'Michael Brown',
        phone: '3105551234',
      },
    ];

    it('should validate sample US customer data', () => {
      sampleCustomers.forEach((customer, index) => {
        const result = validateCustomerInfo(customer);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        
        // Verify US phone numbers
        expect(isValidUSPhone(customer.phone)).toBe(true);
        
        // Verify names are reasonable
        expect(customer.name.length).toBeGreaterThan(2);
      });
    });
  });
});