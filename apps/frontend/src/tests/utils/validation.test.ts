import {
  validateRequired,
  validateEmail,
  validatePhone,
  validatePostalCode,
  formatPhoneNumber,
  validateCustomerInfo,
  validateDeliveryAddress,
} from '../../utils/validation';

describe('Validation Utils', () => {
  describe('validateRequired', () => {
    it('should return undefined for non-empty strings', () => {
      expect(validateRequired('test')).toBeUndefined();
      expect(validateRequired('  test  ')).toBeUndefined();
    });

    it('should return error message for empty strings', () => {
      expect(validateRequired('')).toBe('This field is required');
      expect(validateRequired('   ')).toBe('This field is required');
    });

    it('should return custom error message', () => {
      const customMessage = 'Name is required';
      expect(validateRequired('', customMessage)).toBe(customMessage);
    });
  });

  describe('validateEmail', () => {
    it('should return undefined for valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBeUndefined();
      expect(validateEmail('user.name+tag@domain.co.uk')).toBeUndefined();
      expect(validateEmail('user123@test-domain.com')).toBeUndefined();
    });

    it('should return undefined for empty email (optional field)', () => {
      expect(validateEmail('')).toBeUndefined();
    });

    it('should return error message for invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe('Please enter a valid email address');
      expect(validateEmail('test@')).toBe('Please enter a valid email address');
      expect(validateEmail('@example.com')).toBe('Please enter a valid email address');
      expect(validateEmail('test.example.com')).toBe('Please enter a valid email address');
    });
  });

  describe('validatePhone', () => {
    it('should return undefined for valid phone numbers', () => {
      expect(validatePhone('1234567890')).toBeUndefined();
      expect(validatePhone('11234567890')).toBeUndefined();
      expect(validatePhone('(123) 456-7890')).toBeUndefined();
      expect(validatePhone('123-456-7890')).toBeUndefined();
      expect(validatePhone('+1 (123) 456-7890')).toBeUndefined();
    });

    it('should return error message for invalid phone numbers', () => {
      const errorMessage = 'Please enter a valid phone number (e.g., (555) 123-4567)';
      expect(validatePhone('')).toBe('Phone number is required');
      expect(validatePhone('123')).toBe(errorMessage);
      expect(validatePhone('123456789012')).toBe(errorMessage);
      expect(validatePhone('abcdefghij')).toBe(errorMessage);
    });
  });

  describe('validatePostalCode', () => {
    it('should return undefined for valid ZIP codes', () => {
      expect(validatePostalCode('12345')).toBeUndefined();
      expect(validatePostalCode('12345-6789')).toBeUndefined();
    });

    it('should return error message for invalid ZIP codes', () => {
      const errorMessage = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
      expect(validatePostalCode('')).toBe('ZIP code is required');
      expect(validatePostalCode('1234')).toBe(errorMessage);
      expect(validatePostalCode('123456')).toBe(errorMessage);
      expect(validatePostalCode('abcde')).toBe(errorMessage);
      expect(validatePostalCode('12345-678')).toBe(errorMessage);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 10-digit phone numbers', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890');
    });

    it('should return original string for invalid formats', () => {
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber('abcd')).toBe('abcd');
    });
  });

  describe('validateCustomerInfo', () => {
    it('should return valid result for complete customer info', () => {
      const customerInfo = {
        name: 'John Doe',
        phone: '1234567890',
        email: 'john@example.com',
      };

      const result = validateCustomerInfo(customerInfo);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return valid result without email', () => {
      const customerInfo = {
        name: 'John Doe',
        phone: '1234567890',
      };

      const result = validateCustomerInfo(customerInfo);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return errors for missing required fields', () => {
      const customerInfo = {
        name: '',
        phone: '',
        email: 'invalid-email',
      };

      const result = validateCustomerInfo(customerInfo);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Full name is required');
      expect(result.errors.phone).toBe('Phone number is required');
      expect(result.errors.email).toBe('Please enter a valid email address');
    });
  });

  describe('validateDeliveryAddress', () => {
    it('should return valid result for complete address', () => {
      const address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '12345',
      };

      const result = validateDeliveryAddress(address);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return valid result without postal code', () => {
      const address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
      };

      const result = validateDeliveryAddress(address);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return errors for missing required fields', () => {
      const address = {
        street: '',
        city: '',
        state: '',
        postalCode: 'invalid',
      };

      const result = validateDeliveryAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors.street).toBe('Street address is required');
      expect(result.errors.city).toBe('City is required');
      expect(result.errors.state).toBe('State is required');
      expect(result.errors.postalCode).toBe('Please enter a valid ZIP code (e.g., 12345 or 12345-6789)');
    });
  });
});