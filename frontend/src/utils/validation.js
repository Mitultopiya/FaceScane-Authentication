/**
 * Client-side form validation utilities
 */

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!regex.test(email)) return 'Invalid email address';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Must contain a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Must contain a number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Must contain a special character';
  return '';
};

export const validateName = (name) => {
  if (!name) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (name.trim().length > 100) return 'Name must be less than 100 characters';
  return '';
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
};

export default {
  validateEmail,
  validatePassword,
  validateName,
  validateConfirmPassword,
};
