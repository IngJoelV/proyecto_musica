const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de conexión optimizada
// IMPORTANTE: En Docker para Windows, 'host.docker.internal' es la forma de llegar a tu PostgreSQL local.
const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:Dj5624Vc@host.docker.internal:5432/musica',
    ssl: false
};

const pool = new Pool(dbConfig);

app.use(cors());
app.use(express.json());

// Probar conexión al inicio y reportar errores de red inmediatos
// Esto te dirá en los logs de Docker si la ruta host.docker.internal funcionó
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ ERROR INICIAL DE RED/CONEXIÓN:', err.message);
        console.log('👉 Tip: Si ves "Connection refused", revisa que PostgreSQL en Windows permita conexiones externas.');
    } else {
        console.log('✅ Conexión establecida con PostgreSQL en la base de datos "musica"');
        release();
    }
});

/**
 * LOGIN: Manejo de errores detallado para depuración
 */
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`\n--- Intento de Login ---`);
    console.log(`Usuario: ${username}`);
    
    try {
        // Intento de consulta - Verifica que los nombres de columnas coincidan con tu DB
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE nombre = $1 AND clave = $2', 
            [username, password]
        );

        if (result.rows && result.rows.length > 0) {
            const user = result.rows[0];
            console.log(`✅ Login exitoso para: ${user.nombre}`);
            res.json({ 
                token: "token_valido", 
                username: user.nombre, 
                role: user.rol || 'user'
            });
        } else {
            console.log(`⚠️ Credenciales incorrectas para: ${username}`);
            res.status(401).json({ error: "Usuario o clave incorrectos" });
        }
    } catch (err) {
        // LOGS CRÍTICOS PARA DEPURACIÓN EN CONSOLA DOCKER
        console.error('❌ ERROR EN CONSULTA SQL:', err.message);
        
        res.status(500).json({ 
            error: "Error interno del servidor", 
            detalle: err.message,
            sugerencia: "Verifica que la tabla se llame 'usuarios' y las columnas 'nombre' y 'clave' existan en la DB 'musica'."
        });
    }
});

/**
 * CANCIONES: Forzamos el retorno de Array para evitar error .slice() en React
 */
app.get('/canciones', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM canciones ORDER BY id DESC');
        if (result && Array.isArray(result.rows)) {
            return res.json(result.rows);
        }
        res.json([]);
    } catch (err) {
        console.error('❌ Error al obtener canciones:', err.message);
        res.json([]);
    }
});

/**
 * PLAYLISTS
 */
app.get('/playlists', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM playlists');
        if (result && Array.isArray(result.rows)) {
            const playlists = result.rows.map(p => ({
                ...p,
                songs: p.songs || []
            }));
            return res.json(playlists);
        }
        res.json([]);
    } catch (err) {
        console.error('❌ Error al obtener playlists:', err.message);
        res.json([]);
    }
});

/**
 * LIKES
 */
app.get('/likes', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_cancion FROM likes');
        if (result && Array.isArray(result.rows)) {
            const ids = result.rows
                .map(r => r.id_cancion)
                .filter(id => id !== undefined && id !== null);
            return res.json(ids);
        }
        res.json([]);
    } catch (err) {
        console.error('❌ Error al obtener likes:', err.message);
        res.json([]);
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Servidor escuchando en el puerto ${PORT}`);
    console.log(`🔗 Intentando conectar a PostgreSQL en Windows vía host.docker.internal`);
});