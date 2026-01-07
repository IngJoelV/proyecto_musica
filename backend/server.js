require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';

// ==========================================
// CONFIGURACIÓN DE BASE DE DATOS
// ==========================================
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Dj5624Vc@host.docker.internal:5432/musica';
const isLocalConnection = connectionString.includes('host.docker.internal');

const dbConfig = {
    connectionString: connectionString,
    ssl: isLocalConnection ? false : { rejectUnauthorized: false }
};

const pool = new Pool(dbConfig);

app.use(cors());
app.use(express.json());

// ==========================================
// MIDDLEWARES DE SEGURIDAD
// ==========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ error: "No autorizado" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido" });
        req.user = user;
        next();
    });
};

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO usuarios (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, hashedPassword, 'user']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
        const user = userResult.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, role: user.role, username: user.username });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==========================================
// RUTAS DE CANCIONES
// ==========================================

// LEER CANCIONES
app.get('/canciones', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM canciones ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener canciones" });
    }
});

// CREAR CANCIÓN
app.post('/canciones', authenticateToken, async (req, res) => {
    const { titulo, artista, album, duracion, url } = req.body;
    try {
        await pool.query(
            'INSERT INTO canciones (titulo, artista, album, duracion, url) VALUES ($1, $2, $3, $4, $5)',
            [titulo, artista, album, duracion, url]
        );
        res.json({ message: "Canción guardada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// BORRAR CANCIÓN
app.delete('/canciones/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM canciones WHERE id = $1', [id]);
        res.json({ message: "Canción eliminada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// EDITAR CANCIÓN
app.put('/canciones/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { titulo, artista, album } = req.body;
    try {
        await pool.query('UPDATE canciones SET titulo = $1, artista = $2, album = $3 WHERE id = $4', [titulo, artista, album, id]);
        res.json({ message: "Canción actualizada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// RUTAS DE PLAYLISTS
// ==========================================

// OBTENER PLAYLISTS
app.get('/playlists', async (req, res) => {
    const { userId } = req.query;
    if (!userId || userId === 'undefined' || userId === 'null') return res.json([]); 

    try {
        const idNumerico = parseInt(userId);
        const playlistsQuery = await pool.query('SELECT * FROM playlists WHERE user_id = $1 ORDER BY id DESC', [idNumerico]);
        const playlists = playlistsQuery.rows;

        for (let p of playlists) {
            const songsQuery = await pool.query(
                `SELECT c.* FROM canciones c 
                 JOIN playlist_songs ps ON c.id = ps.song_id 
                 WHERE ps.playlist_id = $1`, 
                [p.id]
            );
            p.songs = songsQuery.rows;
        }
        res.json(playlists);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// CREAR PLAYLIST
app.post('/playlists', async (req, res) => {
    const { name, userId } = req.body;
    try {
        await pool.query('INSERT INTO playlists (name, user_id, is_public) VALUES ($1, $2, $3)', [name, userId, false]);
        res.json({ message: "Playlist creada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// BORRAR PLAYLIST (Versión Completa)
app.delete('/playlists/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const check = await pool.query('SELECT * FROM playlists WHERE id = $1 AND user_id = $2', [id, userId]);
        if (check.rows.length === 0) return res.status(403).json({ error: "No tienes permiso o no existe" });

        // Primero limpiamos las canciones dentro de la playlist
        await pool.query('DELETE FROM playlist_songs WHERE playlist_id = $1', [id]);
        // Luego borramos la playlist
        await pool.query('DELETE FROM playlists WHERE id = $1', [id]);
        
        res.json({ message: "Playlist eliminada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// AGREGAR CANCIÓN A PLAYLIST
app.post('/playlists/:id/songs', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { song_id } = req.body;
    try {
        const check = await pool.query('SELECT * FROM playlists WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rowCount === 0) return res.status(403).json({ error: "No tienes permiso" });
        
        await pool.query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, song_id]);
        res.status(201).json({ message: "Canción agregada" });
    } catch (err) { res.status(500).json({ error: "Error al agregar canción" }); }
});

// ==========================================
// RUTAS DE LIKES
// ==========================================
app.get('/likes', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.json([]);
    try {
        const result = await pool.query('SELECT song_id FROM likes WHERE user_id = $1', [userId]);
        const ids = result.rows.map(r => r.song_id);
        res.json(ids);
    } catch (err) { res.json([]); }
});

app.post('/likes', async (req, res) => {
    const { song_id, userId } = req.body;
    try {
        const check = await pool.query('SELECT * FROM likes WHERE user_id = $1 AND song_id = $2', [userId, song_id]);
        if (check.rows.length > 0) {
            await pool.query('DELETE FROM likes WHERE user_id = $1 AND song_id = $2', [userId, song_id]);
            res.json({ liked: false });
        } else {
            await pool.query('INSERT INTO likes (user_id, song_id) VALUES ($1, $2)', [userId, song_id]);
            res.json({ liked: true });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// INICIO DEL SERVIDOR
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});