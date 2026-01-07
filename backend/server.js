const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de la Base de Datos (Detecta si es Render o Local)
const isProduction = !!process.env.DATABASE_URL;
const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:Dj5624Vc@host.docker.internal:5432/musica',
    ssl: isProduction ? { rejectUnauthorized: false } : false
};

const pool = new Pool(dbConfig);

app.use(cors());
app.use(express.json());

// ==========================================
// 1. RUTAS DE AUTENTICACIÓN
// ==========================================
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE nombre = $1 AND clave = $2', [username, password]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            // Devolvemos un token simple y el ID del usuario para usarlo luego
            res.json({ token: "token_valido", username: user.nombre, role: user.rol, id: user.id });
        } else {
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        await pool.query('INSERT INTO usuarios (nombre, clave, rol) VALUES ($1, $2, $3)', [username, password, 'user']);
        res.json({ message: "Usuario creado" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 2. RUTAS DE CANCIONES (¡Faltaban estas!)
// ==========================================
app.get('/canciones', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM canciones ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { res.json([]); }
});

// CREAR CANCIÓN
app.post('/canciones', async (req, res) => {
    const { titulo, artista, album, duracion, url } = req.body;
    try {
        await pool.query(
            'INSERT INTO canciones (titulo, artista, album, duracion, url) VALUES ($1, $2, $3, $4, $5)',
            [titulo, artista, album, duracion, url]
        );
        res.json({ message: "Canción guardada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// BORRAR CANCIÓN (Esta es la que necesitabas para que funcione el botón de basura)
app.delete('/canciones/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM canciones WHERE id = $1', [id]);
        res.json({ message: "Canción eliminada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// EDITAR CANCIÓN
app.put('/canciones/:id', async (req, res) => {
    const { id } = req.params;
    const { titulo, artista, album } = req.body;
    try {
        await pool.query('UPDATE canciones SET titulo = $1, artista = $2, album = $3 WHERE id = $4', [titulo, artista, album, id]);
        res.json({ message: "Canción actualizada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 3. RUTAS DE PLAYLISTS
// ==========================================
app.get('/playlists', async (req, res) => {
    try {
        // Obtenemos las playlists con sus canciones usando un JOIN
        const playlistsQuery = await pool.query('SELECT * FROM playlists ORDER BY id DESC');
        const playlists = playlistsQuery.rows;

        // Para cada playlist, buscamos sus canciones (esto se puede optimizar, pero funciona bien)
        for (let p of playlists) {
            const songsQuery = await pool.query(
                `SELECT c.* FROM canciones c 
                 JOIN playlist_songs ps ON c.id = ps.song_id 
                 WHERE ps.playlist_id = $1`, 
                [p.id]
            );
            p.songs = songsQuery.rows;
            p.owner = "admin"; // Simplificación si no guardamos owner string
        }
        res.json(playlists);
    } catch (err) { res.json([]); }
});

// CREAR PLAYLIST
app.post('/playlists', async (req, res) => {
    const { name } = req.body;
    try {
        // Asumimos ID usuario 1 (admin) por defecto para que funcione rápido
        await pool.query('INSERT INTO playlists (name, user_id, is_public) VALUES ($1, $2, $3)', [name, 1, true]);
        res.json({ message: "Playlist creada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// BORRAR PLAYLIST
app.delete('/playlists/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM playlists WHERE id = $1', [id]);
        res.json({ message: "Playlist eliminada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// AGREGAR CANCIÓN A PLAYLIST
app.post('/playlists/:id/songs', async (req, res) => {
    const { id } = req.params; // ID de Playlist
    const { song_id } = req.body;
    try {
        await pool.query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2)', [id, song_id]);
        res.json({ message: "Agregada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// QUITAR CANCIÓN DE PLAYLIST
app.delete('/playlists/:pid/songs/:sid', async (req, res) => {
    const { pid, sid } = req.params;
    try {
        await pool.query('DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2', [pid, sid]);
        res.json({ message: "Quitada" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 4. RUTAS DE LIKES
// ==========================================
app.get('/likes', async (req, res) => {
    try {
        // Asumimos usuario ID 1
        const result = await pool.query('SELECT song_id FROM likes WHERE user_id = 1');
        const ids = result.rows.map(r => r.song_id);
        res.json(ids);
    } catch (err) { res.json([]); }
});

// DAR / QUITAR LIKE (Toggle)
app.post('/likes', async (req, res) => {
    const { song_id } = req.body;
    const user_id = 1; // Asumimos usuario 1
    try {
        // Verificamos si ya existe el like
        const check = await pool.query('SELECT * FROM likes WHERE user_id = $1 AND song_id = $2', [user_id, song_id]);
        
        if (check.rows.length > 0) {
            // Si existe, lo borramos (Dislike)
            await pool.query('DELETE FROM likes WHERE user_id = $1 AND song_id = $2', [user_id, song_id]);
            res.json({ liked: false });
        } else {
            // Si no existe, lo creamos (Like)
            await pool.query('INSERT INTO likes (user_id, song_id) VALUES ($1, $2)', [user_id, song_id]);
            res.json({ liked: true });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});