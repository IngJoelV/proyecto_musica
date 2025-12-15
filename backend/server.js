// music-backend/server.js

require('dotenv').config(); 
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3001;

// ------------------------------------------
// 1. MIDDLEWARE: CORS y JSON
// ------------------------------------------
app.use(cors()); // Habilita CORS para permitir conexión desde el frontend (puerto 3000)
app.use(express.json()); // Permite a Express leer cuerpos de solicitud JSON

// ------------------------------------------
// 2. CONEXIÓN A POSTGRESQL (Local)
// ------------------------------------------
const pool = new Pool({
  // Utiliza la variable de entorno del archivo .env
  connectionString: process.env.DATABASE_URL, 
  // --- CONFIGURACIÓN SSL PARA POSTGRES LOCAL ---
  // Indica a pg que NO use SSL. Es esencial para PostgreSQL local (localhost)
  ssl: false 
  // --------------------------------------------
});

// Middleware para verificar el token JWT (Usuario Logueado)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // 401: No autorizado

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // 403: Token inválido/expirado
        req.user = user; // Guarda la info del usuario (id, role)
        next();
    });
};

// Middleware para verificar que el usuario sea 'admin'
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    next();
};

// ------------------------------------------
// RUTAS DE AUTENTICACIÓN
// ------------------------------------------

// Ruta para Registrar Nuevos Usuarios (SIEMPRE con rol 'user')
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // El rol SIEMPRE se fuerza a 'user' para impedir que alguien se registre como admin
        const result = await pool.query(
            'INSERT INTO usuarios (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, hashedPassword, 'user'] 
        );
        res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            user: result.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') { 
            return res.status(409).json({ error: 'El nombre de usuario ya existe.' });
        }
        console.error('Error al registrar usuario:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Ruta para Iniciar Sesión (Identifica el rol, sea 'admin' o 'user')
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
        const user = userResult.rows[0];

        if (!user) return res.status(400).json({ error: 'Credenciales inválidas.' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Credenciales inválidas.' });

        // Generar el Token con el rol incrustado
        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } 
        );

        // Enviar el token y el rol al cliente
        res.json({ token, role: user.role, username: user.username });

    } catch (err) {
        console.error('Error en el login:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ------------------------------------------
// 3. RUTAS PARA CANCIONES (CRUD)
// ------------------------------------------

// 1. Obtener todas las canciones (READ) - RUTA PÚBLICA
app.get('/canciones', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM canciones ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener canciones:", err);
    res.status(500).json({ error: "Error interno al obtener datos." });
  }
});

// 2. Agregar una nueva canción (CREATE) - RUTA PROTEGIDA (AUTH y ADMIN)
app.post('/canciones', authenticateToken, isAdmin, async (req, res) => {
  const { titulo, artista, duracion } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO canciones (titulo, artista, duracion) VALUES ($1, $2, $3) RETURNING *',
      [titulo, artista, duracion]
    );
    res.status(201).json(result.rows[0]); // Código 201 para "Creado"
  } catch (err) {
    console.error("Error al crear canción:", err);
    res.status(500).json({ error: "Error interno al crear canción." });
  }
});

// 3. Actualizar una canción (UPDATE) - RUTA PROTEGIDA (AUTH y ADMIN)
app.put('/canciones/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { titulo, artista, duracion } = req.body;
  try {
    const result = await pool.query(
      'UPDATE canciones SET titulo = $1, artista = $2, duracion = $3 WHERE id = $4 RETURNING *',
      [titulo, artista, duracion, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Canción no encontrada." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al actualizar canción:", err);
    res.status(500).json({ error: "Error interno del servidor al actualizar canción." });
  }
});

// 4. Eliminar una canción (DELETE) - RUTA PROTEGIDA (AUTH y ADMIN)
app.delete('/canciones/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM canciones WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Canción no encontrada." });
    }
    res.status(204).send(); // 204: No Content (eliminación exitosa sin cuerpo de respuesta)
  } catch (err) {
    console.error("Error al eliminar canción:", err);
    res.status(500).json({ error: "Error interno del servidor al eliminar canción." });
  }
});

// ------------------------------------------
// 4. INICIO DEL SERVIDOR
// ------------------------------------------
app.listen(port, () => {
  console.log(`Music Backend running on port ${port}`);
});