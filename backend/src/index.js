const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// ==========================================
// 1. CONFIGURACIÓN DE BASE DE DATOS (EDITA AQUÍ)
// ==========================================
// Estos datos son para tu conexión local. 
// En producción (Docker/Render), se usará automáticamente DATABASE_URL si existe.
const dbConfig = {
    user: 'postgres',        // Ejemplo: 'postgres'
    host: 'localhost',           // Ejemplo: 'localhost'
    database: 'musica',     // Ejemplo: 'musica_db'
    password: 'Dj5624Vc',   // Ejemplo: 'admin123'
    port: 5432,
};

// Lógica de conexión dinámica (Prioriza la variable de entorno del servidor)
const pool = new Pool(
    process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : dbConfig
);

app.use(cors());
app.use(express.json());

// ==========================================
// 2. RUTAS DE PRUEBA
// ==========================================
app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            mensaje: "Backend en Docker conectado a PostgreSQL",
            db_time: result.rows[0].now,
            estado: "Online"
        });
    } catch (err) {
        res.status(500).json({ error: "Error de conexión", details: err.message });
    }
});

// ==========================================
// 3. IMPLEMENTACIÓN DE RUTAS (API)
// ==========================================

// --- Canciones ---
app.get('/canciones', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM canciones ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/canciones', async (req, res) => {
    const { titulo, artista, album, duracion, url } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO canciones (titulo, artista, album, duracion, url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [titulo, artista, album, duracion, url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/canciones/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM canciones WHERE id = $1', [req.params.id]);
        res.json({ mensaje: "Eliminado correctamente" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Login ---
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE username = $1 AND password = $2', [username, password]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.json({ 
                token: "session-token-valid", 
                username: user.username, 
                role: user.role 
            });
        } else {
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Playlists & Likes ---
app.get('/playlists', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM playlists');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/likes', async (req, res) => {
    try {
        const result = await pool.query('SELECT song_id FROM likes');
        res.json(result.rows.map(r => r.song_id));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/likes', async (req, res) => {
    const { song_id } = req.body;
    try {
        const exists = await pool.query('SELECT * FROM likes WHERE song_id = $1', [song_id]);
        if (exists.rows.length > 0) {
            await pool.query('DELETE FROM likes WHERE song_id = $1', [song_id]);
            res.json({ liked: false });
        } else {
            await pool.query('INSERT INTO likes (song_id) VALUES ($1)', [song_id]);
            res.json({ liked: true });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 4. INICIO DEL SERVIDOR
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});