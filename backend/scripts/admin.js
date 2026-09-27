// Da o quita el rol de administrador a un usuario.
//
//   npm run admin                         → lista los administradores
//   npm run admin -- <email>              → lo hace administrador
//   npm run admin -- <email> --quitar     → le quita el rol
//
// Necesita el archivo backend/.env con la conexión a la base de datos.

import pool from '../config/database.js';

const [email, opcion] = process.argv.slice(2);

const listar = async () => {
  const { rows } = await pool.query('SELECT nombre, email FROM usuarios WHERE es_admin ORDER BY id');
  if (rows.length === 0) {
    console.log('No hay administradores. Para crear uno:  npm run admin -- <email>');
    return;
  }
  console.log('Administradores:\n');
  rows.forEach(u => console.log(`  ${u.nombre} <${u.email}>`));
};

const main = async () => {
  if (!email) return listar();
  if (opcion && opcion !== '--quitar') {
    console.error(`Opción desconocida "${opcion}". Uso: npm run admin -- <email> [--quitar]`);
    process.exitCode = 1;
    return;
  }

  const esAdmin = opcion !== '--quitar';
  const { rows } = await pool.query(
    'UPDATE usuarios SET es_admin = $1 WHERE email = $2 RETURNING nombre, email',
    [esAdmin, email.toLowerCase()]
  );
  if (rows.length === 0) {
    console.error(`Error: no existe un usuario con el email ${email}`);
    process.exitCode = 1;
    return;
  }
  const u = rows[0];
  console.log(esAdmin
    ? `${u.nombre} <${u.email}> ahora es administrador. Debe cerrar sesión y volver a entrar (o recargar) para ver el panel.`
    : `${u.nombre} <${u.email}> ya no es administrador.`);
};

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
