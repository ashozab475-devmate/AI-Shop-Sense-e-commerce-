/**
 * Auth Validators
 */

export function validateSignUp({ name, email, password, phone }) {
  const errors = {};

  if (!name?.trim())                       errors.name     = 'Name is required';
  if (!email?.trim())                      errors.email    = 'Email is required';
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email    = 'Invalid email address';
  if (!password)                           errors.password = 'Password is required';
  else if (password.length < 6)           errors.password = 'Password must be at least 6 characters';

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateSignIn({ email, password }) {
  const errors = {};

  if (!email?.trim())                      errors.email    = 'Email is required';
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email    = 'Invalid email address';
  if (!password)                           errors.password = 'Password is required';

  return { valid: Object.keys(errors).length === 0, errors };
}
