import React, { useEffect, useState, useRef } from 'react';

// ==========================================
// CONFIGURACIÓN DE LA API
// ==========================================
// Apuntamos a tu servidor en Render
const API_URL = 'https://musica-o2xj.onrender.com';

// ==========================================
// 1. COMPONENTE DE LOGIN
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
        <div className="d-flex justify-content-center align-items-center vh-100 bg-black">
            <div className="card bg-dark text-white border-secondary shadow-lg p-4" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="text-center mb-4">
                    <i className="bi bi-spotify text-success" style={{ fontSize: '3rem' }}></i>
                    <h2 className="fw-bold mt-2">Música App</h2>
                    <p className="text-white-50">{isLoginView ? 'Inicia sesión' : 'Regístrate'}</p>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <input required type="text" className="form-control bg-dark text-white border-secondary" 
                            placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} />
                    </div>
                    <div className="mb-3">
                        <input required type="password" className="form-control bg-dark text-white border-secondary" 
                            placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-success w-100 fw-bold py-2">
                        {isLoginView ? 'Entrar' : 'Registrarse'}
                    </button>
                </form>
                
                <div className="mt-3 text-center">
                    <button className="btn btn-link text-success text-decoration-none btn-sm" onClick={() => setIsLoginView(!isLoginView)}>
                        {isLoginView ? '¿No tienes cuenta? Crea una' : '¿Ya tienes cuenta? Ingresa'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 2. APLICACIÓN PRINCIPAL
// ==========================================
function App() {
    // --- ESTADOS DE DATOS ---
    const [user, setUser] = useState(null);
    const [canciones, setCanciones] = useState([]);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [likedSongsIds, setLikedSongsIds] = useState([]);

    // --- ESTADOS DE FORMULARIO (ADMIN + ITUNES) ---
    const [showForm, setShowForm] = useState(false);
    const [itunesQuery, setItunesQuery] = useState('');
    const [itunesResults, setItunesResults] = useState([]);
    const [form, setForm] = useState({ titulo: '', artista: '', album: '', duracion: '', url: '' });

    // --- REPRODUCTOR ---
    const [currentSong, setCurrentSong] = useState(null);
    const audioRef = useRef(null);

    // --- INICIALIZACIÓN ---
    useEffect(() => {
        const storedUser = localStorage.getItem('music_user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchData(parsedUser);
        }
    }, []);

    // Helper para headers
    const getAuthHeaders = () => user ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` } : {};

    // --- CARGA DE DATOS ---
    const fetchData = (currentUser) => {
        if (!currentUser) return;
        
        // 1. Canciones (Públicas)
        fetch(`${API_URL}/canciones`)
            .then(r => r.json())
            .then(d => setCanciones(Array.isArray(d) ? d : []))
            .catch(e => console.error("Error canciones:", e));

        // 2. Playlists y Likes (Privados)
        if (currentUser.id) {
            fetch(`${API_URL}/playlists?userId=${currentUser.id}`, { headers: { 'Authorization': `Bearer ${currentUser.token}` } })
                .then(r => r.json())
                .then(d => setUserPlaylists(Array.isArray(d) ? d : []))
                .catch(e => console.error("Error playlists:", e));

            fetch(`${API_URL}/likes?userId=${currentUser.id}`, { headers: { 'Authorization': `Bearer ${currentUser.token}` } })
                .then(r => r.json())
                .then(d => setLikedSongsIds(Array.isArray(d) ? d : []))
                .catch(e => console.error("Error likes:", e));
        }
    };

    // --- AUTENTICACIÓN ---
    const handleAuth = async (isLogin, data) => {
        try {
            const res = await fetch(`${API_URL}/${isLogin ? 'login' : 'register'}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            
            if (res.ok) {
                // Si el login devuelve el ID directamente, úsalo. Si no, intenta decodificar.
                let userId = result.id;
                if (!userId && result.token) {
                    try { userId = JSON.parse(atob(result.token.split('.')[1])).id; } catch(e){}
                }
                
                const finalUser = { ...result, id: userId };
                setUser(finalUser);
                localStorage.setItem('music_user', JSON.stringify(finalUser));
                fetchData(finalUser);
            } else {
                alert(result.error || "Error de autenticación");
            }
        } catch (error) { console.error(error); alert("Error de conexión"); }
    };

    const handleLogout = () => {
        setUser(null);
        setCanciones([]);
        setUserPlaylists([]);
        localStorage.removeItem('music_user');
    };

    // --- LÓGICA ITUNES (NUEVO) ---
    const searchItunes = async (e) => {
        e.preventDefault();
        if (!itunesQuery) return;
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${itunesQuery}&media=music&limit=4`);
            const data = await res.json();
            setItunesResults(data.results);
        } catch (error) { alert("Error buscando en iTunes"); }
    };

    const selectItunesSong = (track) => {
        setForm({
            titulo: track.trackName,
            artista: track.artistName,
            album: track.collectionName,
            duracion: '0:30', // iTunes preview suele ser 30s
            url: track.previewUrl
        });
        setItunesResults([]); // Limpiar resultados
        setItunesQuery('');
    };

    // --- ACCIONES ADMIN (SUBIR / BORRAR) ---
    const handleUpload = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_URL}/canciones`, {
                method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(form)
            });
            setForm({ titulo: '', artista: '', album: '', duracion: '', url: '' });
            setShowForm(false);
            fetchData(user);
            alert("¡Canción subida con éxito!");
        } catch (e) { console.error(e); }
    };

    const deleteSong = async (id) => {
        if (!window.confirm("¿ADMIN: Eliminar esta canción para todos?")) return;
        try {
            await fetch(`${API_URL}/canciones/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            fetchData(user);
        } catch (e) { console.error(e); }
    };

    // --- ACCIONES PLAYLISTS ---
    const createPlaylist = async () => {
        const name = prompt("Nombre de la playlist:");
        if (name) {
            await fetch(`${API_URL}/playlists`, {
                method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ name, userId: user.id })
            });
            fetchData(user);
        }
    };

    const deletePlaylist = async (id) => {
        if (window.confirm("¿Eliminar playlist?")) {
            await fetch(`${API_URL}/playlists/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            fetchData(user);
        }
    };

    const addToPlaylist = async (songId) => {
        if (userPlaylists.length === 0) return alert("Primero crea una playlist en el menú lateral.");
        // Por defecto agregamos a la primera playlist (se puede mejorar con un modal)
        const targetPlaylist = userPlaylists[0];
        
        if(window.confirm(`¿Agregar a "${targetPlaylist.name}"?`)) {
            await fetch(`${API_URL}/playlists/${targetPlaylist.id}/songs`, {
                method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ song_id: songId })
            });
            fetchData(user);
        }
    };

    const toggleLike = async (songId) => {
        await fetch(`${API_URL}/likes`, {
            method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ song_id: songId, userId: user.id })
        });
        fetchData(user);
    };

    // --- EFECTO REPRODUCTOR ---
    useEffect(() => {
        if (currentSong && audioRef.current) {
            audioRef.current.src = currentSong.url;
            audioRef.current.play().catch(e => console.error("Auto-play error:", e));
        }
    }, [currentSong]);


    // ==========================================
    // RENDERIZADO DE LA UI
    // ==========================================
    if (!user) return <LoginAuth onAuthSubmit={handleAuth} />;

    return (
        <div className="d-flex flex-column vh-100 bg-black text-white font-monospace">
            
            {/* NAVBAR */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary bg-dark">
                <div className="d-flex align-items-center">
                    <i className="bi bi-spotify text-success fs-3 me-2"></i>
                    <h5 className="m-0 fw-bold">Música <span className="badge bg-secondary ms-2" style={{fontSize:'0.6em'}}>{user.role}</span></h5>
                </div>
                <div className="d-flex gap-2">
                    {user.role === 'admin' && (
                        <button className={`btn btn-sm ${showForm ? 'btn-secondary' : 'btn-success'}`} onClick={() => setShowForm(!showForm)}>
                            {showForm ? 'Cerrar Panel' : 'Panel Admin'}
                        </button>
                    )}
                    <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>Salir</button>
                </div>
            </div>

            <div className="d-flex flex-grow-1 overflow-hidden">
                
                {/* SIDEBAR (PLAYLISTS) */}
                <div className="d-none d-md-flex flex-column p-3 bg-dark border-end border-secondary" style={{ width: '250px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-white-50 fw-bold small">TU BIBLIOTECA</span>
                        <button className="btn btn-link text-white p-0" onClick={createPlaylist}><i className="bi bi-plus-lg"></i></button>
                    </div>
                    
                    <div className="overflow-auto flex-grow-1 custom-scrollbar">
                        {userPlaylists.map(p => (
                            <div key={p.id} className="p-2 mb-1 rounded hover-bg-gray d-flex justify-content-between align-items-center group-hover-visible">
                                <div className="text-truncate" style={{maxWidth:'180px'}}>
                                    <div>{p.name}</div>
                                    <div className="small text-muted" style={{fontSize:'0.75rem'}}>{p.songs ? p.songs.length : 0} canciones</div>
                                </div>
                                <i className="bi bi-x text-danger opacity-0 delete-btn" style={{cursor:'pointer'}} onClick={() => deletePlaylist(p.id)}></i>
                            </div>
                        ))}
                        {userPlaylists.length === 0 && <div className="small text-muted fst-italic">Sin playlists</div>}
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="flex-grow-1 p-4 overflow-auto custom-scrollbar">
                    
                    {/* PANEL DE ADMINISTRADOR (ITUNES + FORMULARIO) */}
                    {showForm && user.role === 'admin' && (
                        <div className="card bg-secondary text-white mb-4 p-3 shadow fade-in">
                            <h5 className="mb-3"><i className="bi bi-magic me-2"></i>Subida Inteligente</h5>
                            
                            {/* Buscador iTunes */}
                            <form onSubmit={searchItunes} className="d-flex gap-2 mb-3">
                                <input className="form-control form-control-sm bg-dark text-white border-0" 
                                    placeholder="Buscar canción en iTunes (ej: Bad Bunny)" 
                                    value={itunesQuery} onChange={e => setItunesQuery(e.target.value)} />
                                <button type="submit" className="btn btn-primary btn-sm">Buscar</button>
                            </form>

                            {/* Resultados iTunes */}
                            {itunesResults.length > 0 && (
                                <div className="list-group mb-3">
                                    {itunesResults.map((track, i) => (
                                        <button key={i} className="list-group-item list-group-item-action bg-dark text-white border-secondary d-flex justify-content-between align-items-center"
                                                onClick={() => selectItunesSong(track)}>
                                            <div className="d-flex align-items-center">
                                                <img src={track.artworkUrl60} alt="cover" className="rounded me-3" style={{width:'40px'}}/>
                                                <div>
                                                    <div className="fw-bold small">{track.trackName}</div>
                                                    <div className="small text-white-50">{track.artistName}</div>
                                                </div>
                                            </div>
                                            <span className="badge bg-success">Usar</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Formulario de Edición */}
                            <form onSubmit={handleUpload} className="row g-2 border-top border-dark pt-3">
                                <div className="col-md-6"><input className="form-control form-control-sm bg-dark text-white border-0" placeholder="Título" value={form.titulo} onChange={e=>setForm({...form, titulo:e.target.value})} required/></div>
                                <div className="col-md-6"><input className="form-control form-control-sm bg-dark text-white border-0" placeholder="Artista" value={form.artista} onChange={e=>setForm({...form, artista:e.target.value})} required/></div>
                                <div className="col-md-6"><input className="form-control form-control-sm bg-dark text-white border-0" placeholder="Álbum" value={form.album} onChange={e=>setForm({...form, album:e.target.value})} required/></div>
                                <div className="col-md-6"><input className="form-control form-control-sm bg-dark text-white border-0" placeholder="URL Audio" value={form.url} onChange={e=>setForm({...form, url:e.target.value})} required/></div>
                                <div className="col-12"><button className="btn btn-success btn-sm w-100 fw-bold">Guardar Canción</button></div>
                            </form>
                        </div>
                    )}

                    {/* LISTA DE CANCIONES */}
                    <h4 className="fw-bold mb-3">Canciones Disponibles</h4>
                    <div className="list-group">
                        {canciones.map((c, i) => (
                            <div key={c.id} className="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center mb-2 rounded hover-bg-gray">
                                <div className="d-flex align-items-center flex-grow-1" style={{cursor:'pointer'}} onClick={() => { setCurrentSong(c); }}>
                                    <span className="text-muted me-3" style={{width:'20px'}}>{i + 1}</span>
                                    <div>
                                        <div className="fw-bold text-truncate" style={{maxWidth:'250px'}}>{c.titulo}</div>
                                        <div className="small text-white-50">{c.artista}</div>
                                    </div>
                                </div>
                                
                                <div className="d-flex align-items-center gap-2">
                                    <button className="btn btn-icon text-white-50 hover-text-success" onClick={() => toggleLike(c.id)}>
                                        <i className={`bi ${likedSongsIds.includes(c.id) ? 'bi-heart-fill text-success' : 'bi-heart'}`}></i>
                                    </button>
                                    <button className="btn btn-icon text-white-50 hover-text-white" onClick={() => addToPlaylist(c.id)}>
                                        <i className="bi bi-plus-circle"></i>
                                    </button>
                                    
                                    {/* SOLO ADMIN VE BOTÓN DE BORRAR */}
                                    {user.role === 'admin' && (
                                        <button className="btn btn-icon text-white-50 hover-text-danger ms-2" onClick={() => deleteSong(c.id)}>
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {canciones.length === 0 && <div className="text-center p-5 text-muted">No hay canciones aún.</div>}
                    </div>
                </div>
            </div>

            {/* BARRA DE REPRODUCCIÓN */}
            {currentSong && (
                <div className="bg-dark border-top border-secondary p-2 d-flex align-items-center justify-content-between shadow-lg" style={{ height: '85px', zIndex: 100 }}>
                    <div className="d-flex align-items-center w-25 ms-3">
                        <div className="bg-secondary d-flex justify-content-center align-items-center rounded me-3" style={{width:'50px', height:'50px'}}>
                            <i className="bi bi-music-note-beamed fs-4"></i>
                        </div>
                        <div className="text-truncate">
                            <div className="fw-bold text-truncate">{currentSong.titulo}</div>
                            <div className="small text-white-50">{currentSong.artista}</div>
                        </div>
                    </div>
                    <div className="w-50 text-center">
                        <audio ref={audioRef} controls className="w-100 custom-audio" />
                    </div>
                    <div className="w-25 text-end me-3"></div>
                </div>
            )}
        </div>
    );
}

export default App;