// Cuotas fijas por pronóstico. Deben coincidir con ODDS en frontend/src/utils/futbol.js
export const CUOTAS = { '1': 1.85, 'X': 3.2, '2': 4.1 };

export const cuotaDe = (prediccion) => CUOTAS[prediccion];
