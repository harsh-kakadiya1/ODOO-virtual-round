// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password) => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasMinLength = password.length >= 8;

  return {
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
    hasMinLength,
    isValid: hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && hasMinLength
  };
};

// Password strength calculation
export const calculatePasswordStrength = (password) => {
  if (!password) return { strength: 'none', score: 0 };

  const validation = validatePassword(password);
  let score = 0;

  if (validation.hasMinLength) score += 1;
  if (validation.hasUpperCase) score += 1;
  if (validation.hasLowerCase) score += 1;
  if (validation.hasNumber) score += 1;
  if (validation.hasSpecialChar) score += 1;

  if (score <= 2) return { strength: 'weak', score };
  if (score <= 4) return { strength: 'medium', score };
  return { strength: 'strong', score };
};

// Company name validation
export const validateCompanyName = (name) => {
  if (!name || name.trim().length < 2) {
    return { isValid: false, message: 'Company name must be at least 2 characters long' };
  }
  if (name.trim().length > 50) {
    return { isValid: false, message: 'Company name must be less than 50 characters' };
  }
  return { isValid: true, message: '' };
};

// Name validation
export const validateName = (name, fieldName) => {
  if (!name || name.trim().length < 2) {
    return { isValid: false, message: `${fieldName} must be at least 2 characters long` };
  }
  if (name.trim().length > 30) {
    return { isValid: false, message: `${fieldName} must be less than 30 characters` };
  }
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return { isValid: false, message: `${fieldName} can only contain letters and spaces` };
  }
  return { isValid: true, message: '' };
};