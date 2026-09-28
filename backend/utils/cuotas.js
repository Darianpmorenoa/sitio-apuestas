// Cuotas fijas por pronóstico. Deben coincidir con ODDS en frontend/src/utils/futbol.js
export const CUOTAS = { '1': 1.85, 'X': 3.2, '2': 4.1 };

export const cuotaDe = (prediccion) => CUOTAS[prediccion];

// Los créditos (saldo, montos, pagos) son siempre enteros.
// Convierte un valor leído de la base (número o texto) y falla si trae decimales.
export const creditosDe = (valor) => {
  const n = Number(valor);
  if (!Number.isSafeInteger(n)) throw new Error(`Monto de créditos no entero: ${valor}`);
  return n;
};

// La cuota en centésimas (1.85 → 185) para calcular solo con enteros
const centesimasDe = (cuota) => Math.round(Number(cuota) * 100);

// Lo que se paga por una apuesta ganada: monto × cuota, redondeado hacia abajo.
// Ej.: $5 a cuota 1.85 = 9,25 → paga $9. Igual que pagoPotencial en frontend/src/utils/futbol.js
export const pagoDe = (monto, cuota) => Math.floor((monto * centesimasDe(cuota)) / 100);
