import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEmail, validatePassword, validateNombre, validateBetAmount, esIdValido } from '../utils/validators.js';

test('validateEmail: acepta emails válidos y rechaza el resto', () => {
  assert.equal(validateEmail('juan@test.cl'), true);
  for (const email of ['noesmail', 'a@b', '', 123, null, undefined, `${'a'.repeat(250)}@test.cl`]) {
    assert.equal(validateEmail(email), false, `debería rechazar ${email}`);
  }
});

test('validatePassword: exige 6 caracteres, una mayúscula y un número', () => {
  assert.equal(validatePassword('Prueba123').valid, true);
  for (const password of ['1', 'prueba123', 'PruebaSin', 123456, undefined]) {
    assert.equal(validatePassword(password).valid, false, `debería rechazar ${password}`);
  }
});

test('validateNombre: entre 3 y 100 caracteres', () => {
  assert.equal(validateNombre('Juan').valid, true);
  for (const nombre of ['ab', '   ', 'a'.repeat(101), 42, undefined]) {
    assert.equal(validateNombre(nombre).valid, false);
  }
});

test('validateBetAmount: entero de $1 a $100.000 sin pasar el saldo', () => {
  assert.equal(validateBetAmount(10, 1000).valid, true);
  assert.equal(validateBetAmount(1000, '1000').valid, true);
  assert.equal(validateBetAmount(100000, 500000).valid, true);

  const casos = [
    [0, /mínimo/],
    [-5, /mínimo/],
    ['10', /entero/],
    [12.5, /entero/],
    [0.001, /entero/],
    [NaN, /entero/],
    [Infinity, /entero/],
    [2 ** 53, /entero/],
    [1500, /Saldo insuficiente/],
    [100001, /máximo/]
  ];
  for (const [monto, error] of casos) {
    const saldo = monto === 100001 ? 500000 : 1000;
    assert.match(validateBetAmount(monto, saldo).error ?? '', error, `monto ${monto}`);
  }
});

test('esIdValido: solo enteros positivos', () => {
  assert.equal(esIdValido(1), true);
  assert.equal(esIdValido('42'), true);
  for (const id of ['abc', '1.5', 0, -1, '', null, undefined, 2 ** 31]) {
    assert.equal(esIdValido(id), false, `debería rechazar ${id}`);
  }
});
