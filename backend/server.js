// music-backend/server.js

require('dotenv').config(); 
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); 
const app = express();
const port = 3001;

// ------------------------------------------
// 1. MIDDLEWARE: CORS y JSON
// ------------------------------------------
app.use(cors()); // Habilita CORS para permitir conexión desde el frontend (puerto 3000)
app.use(express.json()); // Permite a Express leer cuerpos de solicitud JSON

// ------------------------------------------
// 2. CONEXIÓN A POSTGRESQL (Railway)
// ------------------------------------------
const pool = new Pool({
  // Utiliza la variable de entorno del archivo .env
  connectionString: process.env.DATABASE_URL, 
  // Configuración SSL necesaria para conexiones externas (como Railway)
  ssl: {
    rejectUnauthorized: false
  }
});

// ------------------------------------------
// 3. RUTAS PARA CANCIONES (CRUD)
// ------------------------------------------

// 1. Obtener todas las canciones (READ)
app.get('/canciones', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM canciones ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener canciones:", err);
    res.status(500).json({ error: "Error interno al obtener datos." });
  }
});

// 2. Agregar una nueva canción (CREATE)
app.post('/canciones', async (req, res) => {
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

// 3. Actualizar una canción (UPDATE)
app.put('/canciones/:id', async (req, res) => {
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

// 4. Eliminar una canción (DELETE)
app.delete('/canciones/:id', async (req, res) => {
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