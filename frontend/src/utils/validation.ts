// Validation utility functions for form fields

export const validateRequired = (value: string, message: string = 'This field is required'): string | undefined => {
  return value.trim() === '' ? message : undefined;
};

export const validateEmail = (email: string): string | undefined => {
  if (!email) return undefined;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? undefined : 'Please enter a valid email address';
};

export const validatePhone = (phone: string): string | undefined => {
  if (!phone) return 'Phone number is required';
  
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check for US phone number format (10 or 11 digits)
  if (digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly.startsWith('1'))) {
    return undefined;
  }
  
  return 'Please enter a valid phone number (e.g., (555) 123-4567)';
};

export const validatePostalCode = (postalCode: string): string | undefined => {
  if (!postalCode) return 'ZIP code is required';
  
  // Support US ZIP codes (5 digits or 5+4 format)
  const zipRegex = /^\d{5}(-\d{4})?$/;
  
  if (zipRegex.test(postalCode)) {
    return undefined;
  }
  
  return 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (digitsOnly.length === 10) {
    const areaCode = digitsOnly.slice(0, 3);
    const exchange = digitsOnly.slice(3, 6);
    const number = digitsOnly.slice(6, 10);
    return `(${areaCode}) ${exchange}-${number}`;
  }
  
  // Format as +1 (XXX) XXX-XXXX for US numbers with country code
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    const areaCode = digitsOnly.slice(1, 4);
    const exchange = digitsOnly.slice(4, 7);
    const number = digitsOnly.slice(7, 11);
    return `+1 (${areaCode}) ${exchange}-${number}`;
  }
  
  // For international numbers, just add spacing every 3-4 digits
  if (digitsOnly.length > 11) {
    return digitsOnly.replace(/(\d{1,4})(?=\d)/g, '$1 ');
  }
  
  return phone;
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): string | undefined => {
  return value.length < minLength ? `${fieldName} must be at least ${minLength} characters long` : undefined;
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): string | undefined => {
  return value.length > maxLength ? `${fieldName} must be no more than ${maxLength} characters long` : undefined;
};

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateCustomerInfo = (customerInfo: {
  name: string;
  phone: string;
  email?: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};
  
  const nameError = validateRequired(customerInfo.name, 'Full name is required');
  if (nameError) errors.name = nameError;
  
  const phoneError = validatePhone(customerInfo.phone);
  if (phoneError) errors.phone = phoneError;
  
  if (customerInfo.email) {
    const emailError = validateEmail(customerInfo.email);
    if (emailError) errors.email = emailError;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateDeliveryAddress = (address: {
  street: string;
  city: string;
  state: string;
  postalCode?: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};
  
  const streetError = validateRequired(address.street, 'Street address is required');
  if (streetError) errors.street = streetError;
  
  const cityError = validateRequired(address.city, 'City is required');
  if (cityError) errors.city = cityError;
  
  const stateError = validateRequired(address.state, 'State is required');
  if (stateError) errors.state = stateError;
  
  if (address.postalCode) {
    const postalError = validatePostalCode(address.postalCode);
    if (postalError) errors.postalCode = postalError;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};