import React, { useEffect, useState, useRef } from 'react';

// ==========================================
// CONFIGURACIÓN DE LA API (Render vs Local)
// ==========================================
// Usa tu dirección de Render. Si estás probando en tu PC, puedes cambiarla a http://localhost:3001
const API_URL = 'https://proyecto-musica-b69w.onrender.com';

// ==========================================
// 1. COMPONENTE LOGIN
// ==========================================
function LoginAuth({ onAuthSubmit }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginView, setIsLoginView] = useState(true); 

    const handleSubmit = (e) => {
        e.preventDefault();
        onAuthSubmit(isLoginView, { username, password });
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: 'radial-gradient(circle, #202020 0%, #000000 100%)' }}>
            <div className="card card-glass shadow-lg p-4 fade-in" style={{ width: '100%', maxWidth: '420px', borderRadius: '20px' }}>
                <div className="card-body p-4 text-center">
                    <div className="mb-4">
                        <i className="bi bi-music-note-beamed text-success" style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 0 10px rgba(29,185,84,0.5))' }}></i>
                        <h2 className="fw-bold mt-2 text-white">Música Local</h2>
                    </div>
                    <h6 className="mb-4 text-white-50">{isLoginView ? 'Inicia sesión para continuar' : 'Crea una cuenta nueva'}</h6>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-floating mb-3">
                            <input required type="text" className="form-control bg-dark text-white border-secondary" 
                                placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} />
                            <label className="text-white-50">Usuario</label>
                        </div>
                        <div className="form-floating mb-3">
                            <input required type="password" className="form-control bg-dark text-white border-secondary" 
                                placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
                            <label className="text-white-50">Contraseña</label>
                        </div>
                        <button type="submit" className="btn btn-success w-100 py-2 fw-bold fs-5 shadow-sm btn-hover-scale">
                            {isLoginView ? 'Entrar' : 'Registrarse'}
                        </button>
                    </form>
                    
                    <div className="mt-4">
                        <button className="btn btn-link text-decoration-none text-success small" onClick={() => setIsLoginView(!isLoginView)}>
                            {isLoginView ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 2. COMPONENTE ITEM DE CANCIÓN
// ==========================================
function CancionItem({ cancion, index, onDelete, onPlay, onAddToPlaylist, onToggleLike, isLiked }) {
    return (
        <div className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary mb-2 rounded hover-bg-gray fade-in" 
             style={{ animationDelay: `${index * 0.05}s`, transition: 'all 0.2s' }}>
            <div className="d-flex align-items-center flex-grow-1" onClick={() => onPlay(cancion)} style={{ cursor: 'pointer' }}>
                <span className="text-muted me-3 fw-bold" style={{ width: '20px' }}>{index + 1}</span>
                <div className="bg-secondary rounded d-flex justify-content-center align-items-center me-3" style={{ width: '45px', height: '45px' }}>
                    <i className="bi bi-music-note text-white fs-4"></i>
                </div>
                <div>
                    <div className="fw-bold text-truncate" style={{ maxWidth: '200px' }}>{cancion.titulo}</div>
                    <div className="small text-white-50">{cancion.artista} • {cancion.album}</div>
                </div>
            </div>
            
            <div className="d-flex align-items-center gap-2">
                <span className="badge bg-secondary rounded-pill me-2">{cancion.duracion}</span>
                
                {/* Botón Like */}
                <button className="btn btn-icon text-white-50 hover-text-success" onClick={(e) => { e.stopPropagation(); onToggleLike(cancion.id); }}>
                    <i className={`bi ${isLiked ? 'bi-heart-fill text-success' : 'bi-heart'}`}></i>
                </button>

                {/* Botón Agregar a Playlist */}
                <button className="btn btn-icon text-white-50 hover-text-white" onClick={(e) => { e.stopPropagation(); onAddToPlaylist(cancion.id); }}>
                    <i className="bi bi-plus-circle"></i>
                </button>

                {/* Botón Borrar (Solo Admin o Dueño) */}
                <button className="btn btn-icon text-white-50 hover-text-danger" onClick={(e) => { e.stopPropagation(); onDelete(cancion.id); }}>
                    <i className="bi bi-trash"></i>
                </button>
            </div>
        </div>
    );
}

// ==========================================
// 3. APLICACIÓN PRINCIPAL
// ==========================================
function App() {
    const [canciones, setCanciones] = useState([]);
    const [userPlaylists, setUserPlaylists] = useState([]); // Playlists del usuario
    const [likedSongsIds, setLikedSongsIds] = useState([]); // IDs de canciones con like
    
    // Estados del formulario
    const [titulo, setTitulo] = useState('');
    const [artista, setArtista] = useState('');
    const [album, setAlbum] = useState('');
    const [duracion, setDuracion] = useState('');
    const [url, setUrl] = useState('');
    
    // Estados de UI y Reproductor
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showForm, setShowForm] = useState(false);
    
    // Estados de Usuario
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const audioRef = useRef(null);

    // --- MANEJO DE SESIÓN ---
    useEffect(() => {
        const storedUser = localStorage.getItem('music_user');
        if(storedUser) {
            setUser(JSON.parse(storedUser));
            setIsLoggedIn(true);
        }
    }, []);

    useEffect(() => {
        if(isLoggedIn) fetchData();
    }, [isLoggedIn]);

    const getAuthHeaders = () => {
        return user ? { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}` 
        } : {};
    };

    const handleAuth = async (isLogin, data) => {
        const endpoint = isLogin ? '/login' : '/register';
        try {
            const res = await fetch(API_URL + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if(res.ok) {
                const userData = isLogin ? { ...result, id: result.token ? JSON.parse(atob(result.token.split('.')[1])).id : 0 } : result;
                // Decodificamos el token para sacar el ID si no viene explícito, o confiamos en que el login devuelva todo
                // Nota: Tu backend ahora devuelve token, role, username. El ID viene dentro del token payload.
                
                // MEJORA: Decodificar token para obtener ID real si no viene en el body
                const payload = JSON.parse(atob(result.token.split('.')[1]));
                const finalUser = { ...result, id: payload.id };

                setUser(finalUser);
                setIsLoggedIn(true);
                localStorage.setItem('music_user', JSON.stringify(finalUser));
            } else {
                alert(result.error);
            }
        } catch (error) { console.error("Error Auth:", error); alert("Error de conexión"); }
    };

    const handleLogout = () => {
        setUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('music_user');
        setCanciones([]);
        setUserPlaylists([]);
    };

    // --- CARGAR DATOS ---
    const fetchData = () => {
        if (!user) return;

        // 1. Canciones
        fetch(API_URL + '/canciones', { headers: getAuthHeaders() })
            .then(r => r.json())
            .then(d => setCanciones(Array.isArray(d) ? d : []))
            .catch(e => console.error(e));

        // 2. Playlists y Likes (Usamos user.id)
        if(user.id) {
            fetch(`${API_URL}/playlists?userId=${user.id}`, { headers: getAuthHeaders() })
                .then(r => r.json())
                .then(d => setUserPlaylists(d))
                .catch(e => console.error(e));

            fetch(`${API_URL}/likes?userId=${user.id}`, { headers: getAuthHeaders() })
                .then(r => r.json())
                .then(d => setLikedSongsIds(d))
                .catch(e => console.error(e));
        }
    };

    // --- FUNCIONES DE PLAYLISTS ---
    const createPlaylist = async () => {
        const name = prompt("Nombre de la nueva playlist:");
        if (name && user.id) {
            try {
                await fetch(API_URL + '/playlists', { 
                    method: 'POST', 
                    headers: getAuthHeaders(), 
                    body: JSON.stringify({ name, userId: user.id }) 
                });
                fetchData();
            } catch(e) { console.error(e); }
        }
    };

    const deletePlaylist = async (id) => {
        if(!window.confirm("¿Estás seguro de eliminar esta playlist?")) return;
        try {
            await fetch(`${API_URL}/playlists/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            fetchData();
        } catch(e) { console.error(e); alert("No se pudo eliminar"); }
    };

    const addToPlaylist = async (songId) => {
        if(userPlaylists.length === 0) return alert("¡Crea una playlist primero!");
        // Por simplicidad, agregamos a la primera playlist o preguntamos (aquí simplificado)
        // Puedes mejorar esto con un modal, pero por ahora usaremos prompt de ID o agregaremos a la más reciente.
        // Opción rápida: Agregar a la primera playlist encontrada.
        const playlistId = userPlaylists[0].id; 
        
        // O mejor: Prompt para preguntar a cuál (si sabes el ID o índice)
        // Para no complicar, vamos a agregar a la Playlist "0" (la primera).
        // Si quieres elegir, necesitarías un modal.
        
        try {
            await fetch(`${API_URL}/playlists/${playlistId}/songs`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ song_id: songId })
            });
            alert("Agregada a " + userPlaylists[0].name);
            fetchData();
        } catch(e) { console.error(e); }
    };

    // --- FUNCIONES DE CANCIONES ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch(API_URL + '/canciones', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ titulo, artista, album, duracion, url })
            });
            setTitulo(''); setArtista(''); setAlbum(''); setDuracion(''); setUrl(''); setShowForm(false);
            fetchData();
        } catch(e) { console.error(e); }
    };

    const deleteCancion = async (id) => {
        if(!window.confirm("¿Borrar canción?")) return;
        try {
            await fetch(`${API_URL}/canciones/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            fetchData();
        } catch(e) { console.error(e); }
    };

    const toggleLike = async (songId) => {
        if(!user.id) return;
        try {
            await fetch(API_URL + '/likes', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ song_id: songId, userId: user.id })
            });
            fetchData(); // Recargar likes
        } catch(e) { console.error(e); }
    };

    // --- REPRODUCTOR ---
    const playSong = (song) => {
        setCurrentSong(song);
        setIsPlaying(true);
    };

    useEffect(() => {
        if (currentSong && audioRef.current) {
            audioRef.current.src = currentSong.url;
            audioRef.current.play().catch(e => console.error("Error reproducción:", e));
        }
    }, [currentSong]);

    // ==========================================
    // RENDERIZADO
    // ==========================================
    if (!isLoggedIn) return <LoginAuth onAuthSubmit={handleAuth} />;

    return (
        <div className="bg-black min-vh-100 text-white font-monospace">
            <div className="container-fluid d-flex flex-column" style={{ height: '100vh' }}>
                
                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary bg-dark shadow-sm">
                    <h3 className="m-0 fw-bold text-success"><i className="bi bi-spotify me-2"></i>Música</h3>
                    <div className="d-flex gap-3 align-items-center">
                        <span className="text-white-50">Hola, {user.username}</span>
                        <button className="btn btn-outline-success btn-sm" onClick={() => setShowForm(!showForm)}>
                            <i className={`bi ${showForm ? 'bi-x-lg' : 'bi-plus-lg'} me-1`}></i>Subir
                        </button>
                        <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Salir</button>
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL */}
                <div className="row flex-grow-1 overflow-hidden g-0">
                    
                    {/* SIDEBAR (Playlists) */}
                    <div className="col-md-3 bg-dark border-end border-secondary d-none d-md-flex flex-column p-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="text-white-50 m-0"><i className="bi bi-collection-play me-2"></i>Tu Biblioteca</h5>
                            <button className="btn btn-link text-white p-0" onClick={createPlaylist} title="Crear Playlist">
                                <i className="bi bi-plus-circle fs-4"></i>
                            </button>
                        </div>
                        <div className="overflow-auto custom-scrollbar flex-grow-1">
                            {userPlaylists.map(p => (
                                <div key={p.id} className="p-2 mb-2 rounded hover-bg-gray d-flex justify-content-between align-items-center cursor-pointer group-hover-visible">
                                    <div>
                                        <div className="fw-bold">{p.name}</div>
                                        <div className="small text-muted">{p.songs ? p.songs.length : 0} canciones</div>
                                    </div>
                                    <button className="btn btn-icon text-danger btn-sm opacity-0 delete-btn" 
                                            onClick={(e) => { e.stopPropagation(); deletePlaylist(p.id); }}>
                                        <i className="bi bi-x-circle"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ÁREA PRINCIPAL (Canciones) */}
                    <div className="col-md-9 p-4 overflow-auto custom-scrollbar" style={{ background: 'linear-gradient(180deg, #1e1e1e 0%, #121212 100%)' }}>
                        
                        {/* FORMULARIO DE SUBIDA */}
                        {showForm && (
                            <div className="card bg-secondary mb-4 p-3 shadow fade-in">
                                <form onSubmit={handleSubmit} className="row g-2">
                                    <div className="col-md-4"><input className="form-control form-control-sm bg-dark text-white border-0" placeholder="Título" value={titulo} onChange={e=>setTitulo(e.target.value)} required /></div>
                                    <div className="col-md-3"><input className="form-control form-control-sm bg-dark text-white border-0" placeholder="Artista" value={artista} onChange={e=>setArtista(e.target.value)} required /></div>
                                    <div className="col-md-3"><input className="form-control form-control-sm bg-dark text-white border-0" placeholder="URL Audio (mp3)" value={url} onChange={e=>setUrl(e.target.value)} required /></div>
                                    <div className="col-md-2"><input className="form-control form-control-sm bg-dark text-white border-0" placeholder="Duración" value={duracion} onChange={e=>setDuracion(e.target.value)} /></div>
                                    <div className="col-12 text-end"><button type="submit" className="btn btn-success btn-sm w-100">Guardar Canción</button></div>
                                </form>
                            </div>
                        )}

                        <h2 className="fw-bold mb-4">Todas las Canciones</h2>
                        <div className="list-group">
                            {canciones.map((c, i) => (
                                <CancionItem 
                                    key={c.id} 
                                    cancion={c} 
                                    index={i} 
                                    onPlay={playSong} 
                                    onDelete={deleteCancion}
                                    onAddToPlaylist={addToPlaylist}
                                    onToggleLike={toggleLike}
                                    isLiked={likedSongsIds.includes(c.id)}
                                />
                            ))}
                            {canciones.length === 0 && <div className="text-muted p-4 text-center">No hay canciones. ¡Sube la primera!</div>}
                        </div>
                    </div>
                </div>

                {/* REPRODUCTOR FIXED BOTTOM */}
                {currentSong && (
                    <div className="bg-dark border-top border-secondary p-3 d-flex align-items-center justify-content-between shadow-lg" style={{ height: '90px', zIndex: 1000 }}>
                        <div className="d-flex align-items-center w-25">
                            <div className="bg-secondary d-flex justify-content-center align-items-center rounded me-3" style={{width:'56px', height:'56px'}}>
                                <i className="bi bi-music-note-beamed text-white fs-3"></i>
                            </div>
                            <div className="text-truncate">
                                <div className="fw-bold text-white text-truncate">{currentSong.titulo}</div>
                                <div className="small text-white-50">{currentSong.artista}</div>
                            </div>
                        </div>
                        <div className="w-50 text-center">
                            <audio ref={audioRef} controls autoPlay className="w-100 custom-audio" />
                        </div>
                        <div className="w-25 text-end pe-3">
                             <button className="btn btn-icon text-white-50"><i className="bi bi-volume-up"></i></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;