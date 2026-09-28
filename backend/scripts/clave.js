// Cambia la contraseña de un usuario.
//
//   npm run clave -- <email>             → en la base de backend/.env
//   npm run clave:pruebas -- <email>     → en la base de pruebas local (backend/.env.test)
//
// Pide la contraseña nueva dos veces sin mostrarla y la guarda cifrada (bcrypt).
// La contraseña no se escribe en ningún archivo.

import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { validatePassword } from '../utils/validators.js';
import { preguntarOculto } from '../utils/terminal.js';

const [email] = process.argv.slice(2);

const main = async () => {
  if (!email) {
    console.error('Uso: npm run clave -- <email>');
    process.exitCode = 1;
    return;
  }

  const { rows } = await pool.query('SELECT id, nombre, email FROM usuarios WHERE email = $1', [email.trim().toLowerCase()]);
  const usuario = rows[0];
  if (!usuario) {
    console.error(`No existe un usuario con el email ${email}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Cambiar la contraseña de ${usuario.nombre} <${usuario.email}> (base: ${process.env.DB_NAME} en ${process.env.DB_HOST})`);
  const clave = await preguntarOculto('Contraseña nueva: ');
  const validacion = validatePassword(clave);
  if (!validacion.valid) {
    console.error(`Error: ${validacion.error}. No se cambió nada.`);
    process.exitCode = 1;
    return;
  }
  if (await preguntarOculto('Repítela: ') !== clave) {
    console.error('Error: las contraseñas no coinciden. No se cambió nada.');
    process.exitCode = 1;
    return;
  }

  await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [await bcrypt.hash(clave, 10), usuario.id]);
  console.log('Contraseña actualizada. Ya puedes iniciar sesión con ella.');
};

main()
  .catch(error => {
    console.error('Error:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
