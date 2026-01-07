require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';

const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:Dj5624Vc@host.docker.internal:5432/musica',
    ssl: false
};

const pool = new Pool(dbConfig);

app.use(cors());
app.use(express.json());

// --- MIDDLEWARES ---

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

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
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

// --- CANCIONES ---

app.get('/canciones', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM canciones ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener canciones" });
    }
});

// --- PLAYLISTS (AQUÍ ESTÁ LO QUE FALTABA) ---

app.get('/playlists', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM playlists WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        
        const playlists = await Promise.all(result.rows.map(async (p) => {
            const songsResult = await pool.query(
                `SELECT c.* FROM canciones c 
                 JOIN playlist_songs ps ON c.id = ps.song_id 
                 WHERE ps.playlist_id = $1`, [p.id]
            );
            return { ...p, songs: songsResult.rows, owner: req.user.username };
        }));
        
        res.json(playlists);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener playlists" });
    }
});

app.post('/playlists', authenticateToken, async (req, res) => {
    const { name, is_public } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO playlists (name, user_id, is_public) VALUES ($1, $2, $3) RETURNING *', 
            [name, req.user.id, is_public || false]
        );
        res.status(201).json({ ...result.rows[0], songs: [], owner: req.user.username });
    } catch (err) {
        res.status(500).json({ error: "Error al crear playlist" });
    }
});

app.post('/playlists/:id/songs', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { song_id } = req.body;
    try {
        const check = await pool.query('SELECT * FROM playlists WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rowCount === 0) return res.status(403).json({ error: "No tienes permiso" });
        
        await pool.query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, song_id]);
        res.status(201).json({ message: "Canción agregada" });
    } catch (err) {
        res.status(500).json({ error: "Error al agregar canción" });
    }
});

// --- LIKES Y PLAYLIST AUTOMÁTICA ---

app.get('/likes', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT song_id FROM likes WHERE user_id = $1', [req.user.id]);
        res.json(result.rows.map(row => row.song_id));
    } catch (err) {
        res.status(500).json({ error: "Error al obtener likes" });
    }
});

app.post('/likes', authenticateToken, async (req, res) => {
    const { song_id } = req.body;
    try {
        const checkLike = await pool.query('SELECT * FROM likes WHERE user_id = $1 AND song_id = $2', [req.user.id, song_id]);
        let liked = false;
        
        if (checkLike.rowCount > 0) {
            await pool.query('DELETE FROM likes WHERE user_id = $1 AND song_id = $2', [req.user.id, song_id]);
            liked = false;
        } else {
            await pool.query('INSERT INTO likes (user_id, song_id) VALUES ($1, $2)', [req.user.id, song_id]);
            liked = true;
        }

        // Gestión automática de "Me Gusta ❤️"
        let playlistRes = await pool.query("SELECT id FROM playlists WHERE user_id = $1 AND name = 'Me Gusta ❤️'", [req.user.id]);
        let playlistId;

        if (playlistRes.rowCount === 0) {
            const newPl = await pool.query("INSERT INTO playlists (name, user_id, is_public) VALUES ('Me Gusta ❤️', $1, false) RETURNING id", [req.user.id]);
            playlistId = newPl.rows[0].id;
        } else {
            playlistId = playlistRes.rows[0].id;
        }

        if (liked) {
            await pool.query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [playlistId, song_id]);
        } else {
            await pool.query('DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2', [playlistId, song_id]);
        }

        res.json({ liked });
    } catch (err) {
        res.status(500).json({ error: "Error al procesar like" });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});