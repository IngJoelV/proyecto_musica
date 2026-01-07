const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de conexión optimizada
const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:Dj5624Vc@host.docker.internal:5432/musica',
    ssl: false
};

const pool = new Pool(dbConfig);

app.use(cors());
app.use(express.json());

// Probar conexión al inicio para ver logs en Docker
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error de conexión a la DB musica:', err.message);
    } else {
        console.log('✅ Conexión exitosa a la base de datos musica');
        release();
    }
});

// LOGIN: Ajustado a tus columnas 'nombre' y 'clave'
app.post('/login', async (req, res) => {
    const { username, password } = req.body; // Lo que envía el Frontend
    
    try {
        // Consultamos usando TUS nombres de columna del esquema
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE nombre = $1 AND clave = $2', 
            [username, password]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.json({ 
                token: "token_valido", 
                username: user.nombre, 
                role: user.rol // Ajustado si tu columna se llama 'rol'
            });
        } else {
            res.status(401).json({ error: "Usuario o clave incorrectos" });
        }
    } catch (err) {
        console.error('❌ Error en Login:', err.message);
        res.status(500).json({ error: "Error interno", detalle: err.message });
    }
});

// CANCIONES: Ajustado a tu tabla 'canciones'
app.get('/canciones', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM canciones');
        res.json(result.rows || []);
    } catch (err) {
        console.error('❌ Error en Canciones:', err.message);
        res.json([]);
    }
});

// LIKES: Ajustado a tu tabla 'likes'
app.get('/likes', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_cancion FROM likes');
        res.json(result.rows.map(r => r.id_cancion));
    } catch (err) {
        res.json([]);
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor mapeado a la DB 'musica' en puerto ${PORT}`);
});