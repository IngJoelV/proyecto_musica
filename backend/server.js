require('dotenv').config(); 
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const isProduction = process.env.NODE_ENV === 'production';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
    next();
};

// --- AUTH ---
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO usuarios (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, hashedPassword, 'user'] 
        );
        res.status(201).json({ message: 'Usuario registrado', user: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'El usuario ya existe.' });
        res.status(500).json({ error: 'Error del servidor.' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
        const user = userResult.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'Credenciales inválidas.' });
        const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, role: user.role, username: user.username });
    } catch (err) { res.status(500).json({ error: 'Error del servidor.' }); }
});

// --- CANCIONES ---
app.get('/canciones', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM canciones ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Error al obtener canciones" }); }
});

app.post('/canciones', authenticateToken, isAdmin, async (req, res) => {
  const { titulo, artista, duracion, album, url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO canciones (titulo, artista, duracion, album, url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [titulo, artista, duracion, album || null, url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Error al crear canción" }); }
});

app.put('/canciones/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { titulo, artista, duracion, album, url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE canciones SET titulo = $1, artista = $2, duracion = $3, album = $4, url = $5 WHERE id = $6 RETURNING *',
      [titulo, artista, duracion, album || null, url || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Canción no encontrada." });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Error al actualizar canción" }); }
});

app.delete('/canciones/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM canciones WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Canción no encontrada." });
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: "Error al eliminar canción" }); }
});

// --- PLAYLISTS ---
app.get('/playlists', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM playlists WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        const playlists = await Promise.all(result.rows.map(async (p) => {
            const songsResult = await pool.query(
                `SELECT c.* FROM canciones c JOIN playlist_songs ps ON c.id = ps.song_id WHERE ps.playlist_id = $1`, [p.id]
            );
            return { ...p, songs: songsResult.rows, owner: req.user.username };
        }));
        res.json(playlists);
    } catch (err) { res.status(500).json({ error: "Error al obtener playlists" }); }
});

app.post('/playlists', authenticateToken, async (req, res) => {
    const { name, is_public } = req.body;
    try {
        const result = await pool.query('INSERT INTO playlists (name, user_id, is_public) VALUES ($1, $2, $3) RETURNING *', [name, req.user.id, is_public || false]);
        res.status(201).json({ ...result.rows[0], songs: [], owner: req.user.username });
    } catch (err) { res.status(500).json({ error: "Error al crear playlist" }); }
});

app.delete('/playlists/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const check = await pool.query('SELECT * FROM playlists WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rowCount === 0) return res.status(403).json({ error: "No tienes permiso." });
        await pool.query('DELETE FROM playlists WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) { res.status(500).json({ error: "Error al eliminar playlist" }); }
});

app.post('/playlists/:id/songs', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { song_id } = req.body;
    try {
        const check = await pool.query('SELECT * FROM playlists WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rowCount === 0) return res.status(403).json({ error: "No tienes permiso." });
        await pool.query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, song_id]);
        res.status(201).json({ message: "Canción agregada" });
    } catch (err) { res.status(500).json({ error: "Error al agregar canción" }); }
});

app.delete('/playlists/:id/songs/:songId', authenticateToken, async (req, res) => {
    const { id, songId } = req.params;
    try {
        const check = await pool.query('SELECT * FROM playlists WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rowCount === 0) return res.status(403).json({ error: "No tienes permiso." });
        await pool.query('DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2', [id, songId]);
        res.status(204).send();
    } catch (err) { res.status(500).json({ error: "Error al quitar canción" }); }
});

// --- LIKES MEJORADO ---
app.get('/likes', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT song_id FROM likes WHERE user_id = $1', [req.user.id]);
        res.json(result.rows.map(row => row.song_id));
    } catch (err) { res.status(500).json({ error: "Error al obtener likes" }); }
});

app.post('/likes', authenticateToken, async (req, res) => {
    const { song_id } = req.body;
    try {
        // 1. Toggle Like
        const checkLike = await pool.query('SELECT * FROM likes WHERE user_id = $1 AND song_id = $2', [req.user.id, song_id]);
        let liked = false;
        
        if (checkLike.rowCount > 0) {
            await pool.query('DELETE FROM likes WHERE user_id = $1 AND song_id = $2', [req.user.id, song_id]);
            liked = false;
        } else {
            await pool.query('INSERT INTO likes (user_id, song_id) VALUES ($1, $2)', [req.user.id, song_id]);
            liked = true;
        }

        // 2. Gestionar Playlist "Me Gusta ❤️" automáticamente
        // Buscar si existe la playlist
        let playlistRes = await pool.query("SELECT id FROM playlists WHERE user_id = $1 AND name = 'Me Gusta ❤️'", [req.user.id]);
        let playlistId;

        if (playlistRes.rowCount === 0) {
            // Si no existe, crearla
            const newPl = await pool.query("INSERT INTO playlists (name, user_id, is_public) VALUES ('Me Gusta ❤️', $1, false) RETURNING id", [req.user.id]);
            playlistId = newPl.rows[0].id;
        } else {
            playlistId = playlistRes.rows[0].id;
        }

        // Actualizar contenido de la playlist
        if (liked) {
            await pool.query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [playlistId, song_id]);
        } else {
            await pool.query('DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2', [playlistId, song_id]);
        }

        res.json({ liked });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: "Error al procesar like" }); 
    }
});

app.listen(port, () => { console.log(`Backend running on port ${port}`); });