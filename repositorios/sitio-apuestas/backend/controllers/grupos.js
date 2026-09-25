import pool from '../config/database.js';

// Generar código único para invitación
const generarCodigo = () => {
  return 'GRP' + Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const crearGrupo = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const creador_id = req.user.id;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del grupo es requerido' });
    }

    const codigo = generarCodigo();

    const result = await pool.query(
      'INSERT INTO grupos (nombre, descripcion, creador_id, codigo_invitacion) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, descripcion || null, creador_id, codigo]
    );

    const grupo = result.rows[0];

    // Agregar al creador como miembro admin
    await pool.query(
      'INSERT INTO miembros_grupo (grupo_id, usuario_id, rol) VALUES ($1, $2, $3)',
      [grupo.id, creador_id, 'admin']
    );

    res.status(201).json({
      message: 'Grupo creado exitosamente',
      grupo
    });
  } catch (error) {
    console.error('Error al crear grupo:', error);
    res.status(500).json({ error: 'Error al crear el grupo' });
  }
};

export const obtenerGrupos = async (req, res) => {
  try {
    const usuario_id = req.user.id;

    const result = await pool.query(`
      SELECT DISTINCT g.* FROM grupos g
      JOIN miembros_grupo mg ON g.id = mg.grupo_id
      WHERE mg.usuario_id = $1 AND g.activo = true
      ORDER BY g.fecha_creacion DESC
    `, [usuario_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    res.status(500).json({ error: 'Error al obtener grupos' });
  }
};

export const obtenerGrupoDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;

    // Verificar que el usuario es miembro del grupo
    const miembroCheck = await pool.query(
      'SELECT * FROM miembros_grupo WHERE grupo_id = $1 AND usuario_id = $2',
      [id, usuario_id]
    );

    if (miembroCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No tienes acceso a este grupo' });
    }

    const grupoResult = await pool.query('SELECT * FROM grupos WHERE id = $1', [id]);
    const miembrosResult = await pool.query(`
      SELECT u.id, u.nombre, u.email, mg.rol, mg.fecha_union
      FROM miembros_grupo mg
      JOIN usuarios u ON mg.usuario_id = u.id
      WHERE mg.grupo_id = $1
      ORDER BY mg.rol DESC
    `, [id]);

    const apuestasResult = await pool.query(`
      SELECT DISTINCT a.* FROM apuestas a
      JOIN miembros_grupo mg ON a.usuario_id = mg.usuario_id
      WHERE mg.grupo_id = $1
      ORDER BY a.fecha_apuesta DESC
      LIMIT 20
    `, [id]);

    res.json({
      grupo: grupoResult.rows[0],
      miembros: miembrosResult.rows,
      apuestas: apuestasResult.rows
    });
  } catch (error) {
    console.error('Error al obtener grupo:', error);
    res.status(500).json({ error: 'Error al obtener grupo' });
  }
};

export const unirseAlGrupo = async (req, res) => {
  try {
    const { codigo } = req.body;
    const usuario_id = req.user.id;

    if (!codigo) {
      return res.status(400).json({ error: 'Código de invitación requerido' });
    }

    const grupoResult = await pool.query(
      'SELECT * FROM grupos WHERE codigo_invitacion = $1 AND activo = true',
      [codigo.toUpperCase()]
    );

    if (grupoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado o inactivo' });
    }

    const grupo = grupoResult.rows[0];

    // Verificar si ya es miembro
    const miembroCheck = await pool.query(
      'SELECT * FROM miembros_grupo WHERE grupo_id = $1 AND usuario_id = $2',
      [grupo.id, usuario_id]
    );

    if (miembroCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Ya eres miembro de este grupo' });
    }

    // Agregar como miembro
    await pool.query(
      'INSERT INTO miembros_grupo (grupo_id, usuario_id, rol) VALUES ($1, $2, $3)',
      [grupo.id, usuario_id, 'miembro']
    );

    res.json({
      message: 'Te has unido al grupo exitosamente',
      grupo
    });
  } catch (error) {
    console.error('Error al unirse al grupo:', error);
    res.status(500).json({ error: 'Error al unirse al grupo' });
  }
};

export const obtenerLinkWhatsApp = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;

    // Verificar que es admin del grupo
    const adminCheck = await pool.query(
      'SELECT * FROM miembros_grupo WHERE grupo_id = $1 AND usuario_id = $2 AND rol = $3',
      [id, usuario_id, 'admin']
    );

    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Solo admin puede generar invitaciones' });
    }

    const grupoResult = await pool.query('SELECT * FROM grupos WHERE id = $1', [id]);

    if (grupoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const grupo = grupoResult.rows[0];
    const mensaje = `Únete a nuestro grupo de apuestas "${grupo.nombre}" en Apuestas Deportivas!\n\nCódigo de invitación: ${grupo.codigo_invitacion}\n\nDescripción: ${grupo.descripcion || 'Sin descripción'}`;

    // Codificar mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje);
    const linkWhatsApp = `https://wa.me/?text=${mensajeCodificado}`;

    res.json({
      linkWhatsApp,
      codigo: grupo.codigo_invitacion,
      mensaje
    });
  } catch (error) {
    console.error('Error al generar link:', error);
    res.status(500).json({ error: 'Error al generar link de WhatsApp' });
  }
};
