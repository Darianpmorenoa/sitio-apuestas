import readline from 'node:readline';

// Pregunta algo en la terminal sin mostrar lo que se escribe (para contraseñas)
export const preguntarOculto = (pregunta) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = (texto) => {
    if (!rl.silenciado) rl.output.write(texto);
    else if (texto.includes('\n')) rl.output.write('\n');
  };
  rl.question(pregunta, (respuesta) => { rl.close(); resolve(respuesta); });
  rl.silenciado = true;
});
