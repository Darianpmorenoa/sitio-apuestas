export const validateEmail = (email) => {
  if (typeof email !== 'string' || email.length > 255) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < 6) {
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
  if (typeof nombre !== 'string' || nombre.trim().length < 3) {
    return { valid: false, error: 'El nombre debe tener al menos 3 caracteres' };
  }
  if (nombre.trim().length > 100) {
    return { valid: false, error: 'El nombre no debe exceder 100 caracteres' };
  }
  return { valid: true };
};

// Montos de apuesta: créditos enteros entre $1 y $100.000, sin pasar el saldo
export const validateBetAmount = (amount, saldo) => {
  if (typeof amount !== 'number' || !Number.isSafeInteger(amount)) {
    return { valid: false, error: 'El monto debe ser un número entero' };
  }
  if (amount < 1) {
    return { valid: false, error: 'El monto mínimo es $1' };
  }
  if (amount > 100000) {
    return { valid: false, error: 'El monto máximo es $100.000' };
  }
  if (amount > Number(saldo)) {
    return { valid: false, error: 'Saldo insuficiente' };
  }
  return { valid: true };
};

// Ids de la URL o del cuerpo: enteros positivos (evita errores de Postgres con "abc")
export const esIdValido = (id) => {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 && n <= 2147483647;
};
