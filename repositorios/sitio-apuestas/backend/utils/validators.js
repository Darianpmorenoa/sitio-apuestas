export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  if (password.length < 6) {
    return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'La contraseña debe contener al menos una mayúscula' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'La contraseña debe contener al menos un número' };
  }
  return { valid: true };
};

export const validateNombre = (nombre) => {
  if (!nombre || nombre.trim().length < 3) {
    return { valid: false, error: 'El nombre debe tener al menos 3 caracteres' };
  }
  if (nombre.length > 100) {
    return { valid: false, error: 'El nombre no debe exceder 100 caracteres' };
  }
  return { valid: true };
};

export const validateBetAmount = (amount, saldo) => {
  if (!amount || amount <= 0) {
    return { valid: false, error: 'El monto debe ser mayor a 0' };
  }
  if (amount > saldo) {
    return { valid: false, error: 'Saldo insuficiente' };
  }
  if (amount > 100000) {
    return { valid: false, error: 'El monto máximo es $100,000' };
  }
  return { valid: true };
};
