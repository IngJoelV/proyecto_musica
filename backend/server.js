require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_segura';

// ==========================================
// CONFIGURACIÓN DE BASE DE DATOS
// ==========================================
// Detecta si estamos en local o en Render para ajustar SSL
const connectionString = process.env.DATABASE_URL;
const isLocalConnection = connectionString && connectionString.includes('host.docker.internal');

const pool = new Pool({
    connectionString: connectionString,
    ssl: isLocalConnection ? false : { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// ==========================================
// MIDDLEWARES DE SEGURIDAD
// ==========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Requiere login" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido" });
        req.user = user;
        next();
    });
};

const checkAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de Administrador." });
    }
    next();
};

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    console.log("📥 Intento de registro recibido:", username);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Por defecto todos son 'user'. Tú cambiaste el tuyo a 'admin' por base de datos.
        const result = await pool.query(
            'INSERT INTO usuarios (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, hashedPassword, 'user']
        );
        console.log("✅ Usuario registrado con éxito");
        res.status(201).json(result.rows[0]);
    } catch (err) { 
        console.error("❌ ERROR FATAL EN REGISTRO:", err.message);
        console.error(err);
        res.status(500).json({ error: "Error al registrar: " + err.message }); 
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }
        const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET);
        res.json({ token, role: user.role, username: user.username, id: user.id });
    } catch (err) { res.status(500).json({ error: "Error servidor" }); }
});

// ==========================================
// RUTAS DE CANCIONES
// ==========================================
app.get('/canciones', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM canciones ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Crear Canción (SOLO ADMIN)
app.post('/canciones', authenticateToken, checkAdmin, async (req, res) => {
    const { titulo, artista, album, duracion, url } = req.body;
    try {
        await pool.query(
            'INSERT INTO canciones (titulo, artista, album, duracion, url) VALUES ($1, $2, $3, $4, $5)',
            [titulo, artista, album, duracion, url]
        );
        res.json({ message: "Canción guardada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Borrar Canción (SOLO ADMIN)
app.delete('/canciones/:id', authenticateToken, checkAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM canciones WHERE id = $1', [id]);
        res.json({ message: "Canción eliminada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// RUTAS DE PLAYLISTS
// ==========================================
app.get('/playlists', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.json([]);
    try {
        const playlists = await pool.query('SELECT * FROM playlists WHERE user_id = $1 ORDER BY id DESC', [userId]);
        const result = [];
        for (let p of playlists.rows) {
            const songs = await pool.query(
                `SELECT c.* FROM canciones c JOIN playlist_songs ps ON c.id = ps.song_id WHERE ps.playlist_id = $1`, 
                [p.id]
            );
            result.push({ ...p, songs: songs.rows });
        }
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/playlists', authenticateToken, async (req, res) => {
    const { name } = req.body;
    try {
        await pool.query('INSERT INTO playlists (name, user_id, is_public) VALUES ($1, $2, $3)', [name, req.user.id, false]);
        res.json({ message: "Playlist creada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/playlists/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const check = await pool.query('SELECT * FROM playlists WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rowCount === 0) return res.status(403).json({ error: "No autorizado" });
        
        await pool.query('DELETE FROM playlist_songs WHERE playlist_id = $1', [id]);
        await pool.query('DELETE FROM playlists WHERE id = $1', [id]);
        res.json({ message: "Playlist eliminada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/playlists/:id/songs', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { song_id } = req.body;
    try {
        const check = await pool.query('SELECT * FROM playlists WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rowCount === 0) return res.status(403).json({ error: "No autorizado" });

        await pool.query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, song_id]);
        res.json({ message: "Agregada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ELIMINAR CANCIÓN DE UNA PLAYLIST
app.delete('/playlists/:playlistId/songs/:songId', (req, res) => {
    const { playlistId, songId } = req.params;
    
    // Buscamos la playlist
    const playlistIndex = playlists.findIndex(p => p.id == playlistId);
    
    if (playlistIndex === -1) {
        return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    // Filtramos las canciones para quitar la que tiene ese ID
    // (Dejamos todas las que NO sean esa canción)
    playlists[playlistIndex].songs = playlists[playlistIndex].songs.filter(song => song.id != songId);

    res.json({ success: true, playlist: playlists[playlistIndex] });
});
// ==========================================
// RUTAS DE LIKES (MEJORADAS)
// ==========================================
app.get('/likes', async (req, res) => {
    const { userId } = req.query;
    if(!userId) return res.json([]);
    try {
        const result = await pool.query('SELECT song_id FROM likes WHERE user_id = $1', [userId]);
        // DEVUELVE ARRAY SIMPLE: [1, 5, 8]
        const ids = result.rows.map(row => row.song_id); 
        res.json(ids);
    } catch(e) { res.json([]); }
});

app.post('/likes', authenticateToken, async (req, res) => {
    const { song_id, userId } = req.body; 
    try {
        // Verificar si ya existe el like
        const check = await pool.query('SELECT * FROM likes WHERE user_id = $1 AND song_id = $2', [userId, song_id]);
        
        if (check.rowCount > 0) {
            // SI EXISTE -> BORRAR (DISLIKE)
            await pool.query('DELETE FROM likes WHERE user_id = $1 AND song_id = $2', [userId, song_id]);
            res.json({ success: true, action: 'removed' });
        } else {
            // SI NO EXISTE -> AGREGAR (LIKE)
            await pool.query('INSERT INTO likes (user_id, song_id) VALUES ($1, $2)', [userId, song_id]);
            res.json({ success: true, action: 'added' });
        }
    } catch(e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server en ${PORT}`));