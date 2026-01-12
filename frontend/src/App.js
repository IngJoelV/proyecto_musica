import React, { useEffect, useState, useRef } from 'react';
import './App.css';
// ==========================================
// CONFIGURACIÓN DE LA API
// ==========================================
const API_URL = process.env.REACT_APP_API_URL || 'https://musica-o2xj.onrender.com';

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
    const [likedSongsIds, setLikedSongsIds] = useState([]); // Ahora guardará [1, 5, 8]

    // --- ESTADOS DE VISTA (NUEVO) ---
    const [viewMode, setViewMode] = useState('home'); // 'home' | 'likes'
    const [selectedPlaylistName, setSelectedPlaylistName] = useState('Todas las Canciones');
const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
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

    const getAuthHeaders = () => user ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` } : {};

    // --- CARGA DE DATOS ---
    const fetchData = (currentUser) => {
        if (!currentUser) return;
        
        // 1. Canciones
        fetch(`${API_URL}/canciones`)
            .then(r => r.json())
            .then(d => setCanciones(Array.isArray(d) ? d : []))
            .catch(e => console.error("Error canciones:", e));

        if (currentUser.id) {
            // 2. Playlists
            fetch(`${API_URL}/playlists?userId=${currentUser.id}`, { headers: { 'Authorization': `Bearer ${currentUser.token}` } })
                .then(r => r.json())
                .then(d => setUserPlaylists(Array.isArray(d) ? d : []))
                .catch(e => console.error("Error playlists:", e));

            // 3. Likes (Ahora devuelve array simple [1, 2, 3])
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
                let userId = result.id;
                // Intentar decodificar ID si viene en token
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
        setLikedSongsIds([]);
        localStorage.removeItem('music_user');
    };

    // --- LÓGICA ITUNES ---
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
            duracion: '0:30',
            url: track.previewUrl
        });
        setItunesResults([]);
        setItunesQuery('');
    };

    // --- ACCIONES ADMIN ---
    const handleUpload = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_URL}/canciones`, {
                method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(form)
            });
            setForm({ titulo: '', artista: '', album: '', duracion: '', url: '' });
            setShowForm(false);
            fetchData(user);
            alert("¡Canción subida!");
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
// FUNCIÓN PARA QUITAR CANCIÓN DE PLAYLIST
    const removeSongFromPlaylist = async (songId) => {
        if (!selectedPlaylistId) return;

        // 1. UI OPTIMISTA: Lo quitamos visualmente primero
        const updatedPlaylists = userPlaylists.map(p => {
            if (p.id === selectedPlaylistId) {
                // Creamos una copia de la playlist con la canción filtrada
                return { ...p, songs: p.songs.filter(s => s.id !== songId) };
            }
            return p;
        });
        setUserPlaylists(updatedPlaylists);

        // 2. AVISAR AL SERVIDOR
        try {
            await fetch(`${API_URL}/playlists/${selectedPlaylistId}/songs/${songId}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error("Error al eliminar canción:", error);
            // Si falla, idealmente recargaríamos los datos
            fetchData(user);
        }
    };
    const addToPlaylist = async (songId) => {
        if (userPlaylists.length === 0) return alert("Primero crea una playlist en el menú lateral.");
        const targetPlaylist = userPlaylists[0];
        if(window.confirm(`¿Agregar a "${targetPlaylist.name}"?`)) {
            await fetch(`${API_URL}/playlists/${targetPlaylist.id}/songs`, {
                method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ song_id: songId })
            });
            fetchData(user);
        }
    };

    // --- ACCIÓN LIKE (TOGGLE) ---
const toggleLike = async (songId) => {
    alert("¡ESTOY VIVO! ID: " + songId);
        console.log("👆 Click en Like para canción ID:", songId); // 1. Veremos el click
        
        // 2. CAMBIO VISUAL INSTANTÁNEO (Optimistic UI)
        // Si ya lo tengo, lo quito. Si no, lo agrego.
        setLikedSongsIds(prevIds => {
            if (prevIds.includes(songId)) {
                console.log("💔 Quitanto like visualmente...");
                return prevIds.filter(id => id !== songId);
            } else {
                console.log("❤️ Poniendo like visualmente...");
                return [...prevIds, songId];
            }
        });

        // 3. LLAMADA AL SERVIDOR (En segundo plano)
        try {
            const response = await fetch(`${API_URL}/likes`, {
                method: 'POST', 
                headers: getAuthHeaders(), 
                body: JSON.stringify({ song_id: songId, userId: user.id })
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("✅ Respuesta del servidor:", data);
            
            // Opcional: Refrescar datos reales para asegurar sincronización
            // fetchData(user); 
        } catch (error) {
            console.error("❌ ERROR AL DAR LIKE:", error);
            alert("No se pudo guardar el like. Revisa tu conexión.");
            // Si falló, revertimos el cambio visual (opcional, pero recomendado)
            fetchData(user); 
        }
    };

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

// CALCULAR QUÉ CANCIONES MOSTRAR SEGÚN LA VISTA
    let songsToShow = canciones;
    
    if (viewMode === 'likes') {
        songsToShow = canciones.filter(c => likedSongsIds.includes(c.id));
    } 
    // 👇 AGREGA ESTO PARA LAS PLAYLISTS 👇
    else if (viewMode === 'playlist') {
        const playlist = userPlaylists.find(p => p.id === selectedPlaylistId);
        // Si la playlist existe y tiene canciones, las mostramos. Si no, array vacío.
        songsToShow = playlist && playlist.songs ? playlist.songs : [];
    }
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
                
                {/* SIDEBAR */}
                <div className="d-none d-md-flex flex-column p-3 bg-dark border-end border-secondary" style={{ width: '250px' }}>
                    
                    {/* MENÚ PRINCIPAL */}
                    <div className="mb-4">
                        <div className={`p-2 rounded d-flex align-items-center mb-2 ${viewMode === 'home' ? 'bg-secondary text-white' : 'text-white-50 hover-bg-gray'}`} 
                             style={{cursor:'pointer'}} 
                             onClick={() => { setViewMode('home'); setSelectedPlaylistName('Todas las Canciones'); }}>
                            <i className="bi bi-house-door-fill me-3"></i> Inicio
                        </div>
                        
                        {/* BOTÓN MIS ME GUSTA */}
                        <div className={`p-2 rounded d-flex align-items-center ${viewMode === 'likes' ? 'bg-secondary text-white' : 'text-white-50 hover-bg-gray'}`} 
                             style={{cursor:'pointer'}} 
                             onClick={() => { setViewMode('likes'); setSelectedPlaylistName('Mis Me Gusta'); }}>
                            <div className="d-flex justify-content-center align-items-center rounded me-3" 
                                 style={{width:'24px', height:'24px', background: 'linear-gradient(135deg, #450af5, #c4efd9)'}}>
                                <i className="bi bi-heart-fill text-white" style={{fontSize:'12px'}}></i>
                            </div>
                            Mis Me Gusta
                        </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3 border-top border-secondary pt-3">
                        <span className="text-white-50 fw-bold small">TUS PLAYLISTS</span>
                        <button className="btn btn-link text-white p-0" onClick={createPlaylist}><i className="bi bi-plus-lg"></i></button>
                    </div>
                    
  <div className="overflow-auto flex-grow-1 custom-scrollbar">
                        {userPlaylists.map(p => (
                            <div key={p.id} 
                                 className={`p-2 mb-1 rounded d-flex justify-content-between align-items-center group-hover-visible ${selectedPlaylistId === p.id && viewMode === 'playlist' ? 'bg-secondary text-white' : 'hover-bg-gray'}`}
                                 style={{cursor:'pointer'}}
                                 // 👇 AL HACER CLICK, CAMBIAMOS EL MODO Y EL ID
                                 onClick={() => { 
                                     setViewMode('playlist'); 
                                     setSelectedPlaylistId(p.id); 
                                     setSelectedPlaylistName(p.name); 
                                 }}>
                                
                                <div className="text-truncate" style={{maxWidth:'180px'}}>
                                    <div>{p.name}</div>
                                    <div className="small text-muted" style={{fontSize:'0.75rem'}}>
                                        {p.songs ? p.songs.length : 0} canciones
                                    </div>
                                </div>

                                <i className="bi bi-x text-danger opacity-0 delete-btn" 
                                   style={{cursor:'pointer'}} 
                                   onClick={(e) => { 
                                       e.stopPropagation(); // 👈 ESTO EVITA QUE SE ABRA LA PLAYLIST AL BORRAR
                                       deletePlaylist(p.id); 
                                   }}>
                                </i>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL */}
                <div className="flex-grow-1 p-4 overflow-auto custom-scrollbar">
                    
                    {/* PANEL DE ADMIN */}
                    {showForm && user.role === 'admin' && (
                        <div className="card bg-secondary text-white mb-4 p-3 shadow fade-in">
                            <h5 className="mb-3"><i className="bi bi-magic me-2"></i>Subida Inteligente</h5>
                            <form onSubmit={searchItunes} className="d-flex gap-2 mb-3">
                                <input className="form-control form-control-sm bg-dark text-white border-0" 
                                    placeholder="Buscar en iTunes..." value={itunesQuery} onChange={e => setItunesQuery(e.target.value)} />
                                <button type="submit" className="btn btn-primary btn-sm">Buscar</button>
                            </form>
                            {itunesResults.length > 0 && (
                                <div className="list-group mb-3">
                                    {itunesResults.map((track, i) => (
                                        <button key={i} className="list-group-item list-group-item-action bg-dark text-white border-secondary d-flex justify-content-between align-items-center"
                                                onClick={() => selectItunesSong(track)}>
                                            <div className="d-flex align-items-center">
                                                <img src={track.artworkUrl60} alt="cover" className="rounded me-3" style={{width:'40px'}}/>
                                                <div><div className="fw-bold small">{track.trackName}</div><div className="small text-white-50">{track.artistName}</div></div>
                                            </div>
                                            <span className="badge bg-success">Usar</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <form onSubmit={handleUpload} className="row g-2 border-top border-dark pt-3">
                                <div className="col-md-6"><input className="form-control form-control-sm bg-dark text-white border-0" placeholder="Título" value={form.titulo} onChange={e=>setForm({...form, titulo:e.target.value})} required/></div>
                                <div className="col-md-6"><input className="form-control form-control-sm bg-dark text-white border-0" placeholder="Artista" value={form.artista} onChange={e=>setForm({...form, artista:e.target.value})} required/></div>
                                <div className="col-md-6"><input className="form-control form-control-sm bg-dark text-white border-0" placeholder="Álbum" value={form.album} onChange={e=>setForm({...form, album:e.target.value})} required/></div>
                                <div className="col-md-6"><input className="form-control form-control-sm bg-dark text-white border-0" placeholder="URL Audio" value={form.url} onChange={e=>setForm({...form, url:e.target.value})} required/></div>
                                <div className="col-12"><button className="btn btn-success btn-sm w-100 fw-bold">Guardar</button></div>
                            </form>
                        </div>
                    )}

                    {/* HEADER DINÁMICO (TÍTULO) */}
{/* HEADER DINÁMICO (TÍTULO) */}
                    <div className="d-flex align-items-end mb-4">
                        {/* ICONO PARA LIKES */}
                        {viewMode === 'likes' && (
                            <div className="me-3 shadow-lg d-flex align-items-center justify-content-center rounded" 
                                 style={{width:'150px', height:'150px', background: 'linear-gradient(135deg, #450af5, #8e8cd8)'}}>
                                <i className="bi bi-heart-fill text-white" style={{fontSize:'4rem'}}></i>
                            </div>
                        )}
                        {/* 👇 NUEVO ICONO PARA PLAYLISTS PERSONALIZADAS 👇 */}
                        {viewMode === 'playlist' && (
                            <div className="me-3 shadow-lg d-flex align-items-center justify-content-center rounded bg-dark border border-secondary" 
                                 style={{width:'150px', height:'150px'}}>
                                <i className="bi bi-music-note-list text-white" style={{fontSize:'4rem'}}></i>
                            </div>
                        )}

                        <div>
                            <div className="small text-uppercase fw-bold text-white-50">
                                {viewMode === 'likes' ? 'Playlist' : viewMode === 'playlist' ? 'Playlist Privada' : 'Vista'}
                            </div>
                            <h1 className="fw-bold display-4 m-0">{selectedPlaylistName}</h1>
                            {viewMode === 'likes' && <div className="text-white-50 mt-2 small">{songsToShow.length} canciones que te encantan</div>}
                        </div>
                    </div>

                    {/* LISTA DE CANCIONES */}
                    <div className="list-group list-group-flush">
                        {songsToShow.map((c, i) => (
                            <div key={c.id} className="list-group-item bg-black text-white border-0 d-flex justify-content-between align-items-center py-2 hover-bg-gray rounded">
                                <div className="d-flex align-items-center flex-grow-1" style={{cursor:'pointer'}} onClick={() => setCurrentSong(c)}>
                                    <span className="text-muted me-3 text-center" style={{width:'20px'}}>{i + 1}</span>
                                    <img src={c.url && c.url.includes('apple') ? 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Apple_Music_icon.svg' : 'https://cdn-icons-png.flaticon.com/512/401/401146.png'} 
                                         alt="cover" className="me-3 rounded" style={{width:'40px', height:'40px', objectFit:'cover'}}/>
                                    <div>
                                        <div className={`fw-bold ${currentSong?.id === c.id ? 'text-success' : 'text-white'}`}>{c.titulo}</div>
                                        <div className="small text-white-50">{c.artista}</div>
                                    </div>
                                </div>
                              <div className="d-flex align-items-center gap-3">
    {/* 1. Botón ME GUSTA */}
    <button className="btn btn-icon border-0 p-0" onClick={() => toggleLike(c.id)}>
        <i className={`bi ${likedSongsIds.includes(c.id) ? 'bi-heart-fill text-success' : 'bi-heart text-white-50'}`}></i>
    </button>

    {/* 2. NUEVO: Botón QUITAR DE PLAYLIST (Solo aparece en modo playlist) */}
    {viewMode === 'playlist' && (
        <button className="btn btn-icon border-0 p-0" title="Quitar" onClick={(e) => { e.stopPropagation(); removeSongFromPlaylist(c.id); }}>
            <i className="bi bi-trash3 text-secondary hover-text-danger"></i>
        </button>
    )}

    {/* 3. Botón AGREGAR A PLAYLIST (Opcional: puedes ocultarlo si ya estás en una playlist, o dejarlo) */}
    <button className="btn btn-icon border-0 p-0 text-white-50 hover-text-white" onClick={() => addToPlaylist(c.id)}>
        <i className="bi bi-plus-circle"></i>
    </button>

    {/* 4. Botón ADMIN (Borrar del sistema) */}
    {user.role === 'admin' && (
        <button className="btn btn-icon border-0 p-0 text-white-50 hover-text-danger" onClick={() => deleteSong(c.id)}>
            <i className="bi bi-trash"></i>
        </button>
    )}
</div>
                            </div>
                        ))}
                        {songsToShow.length === 0 && (
                            <div className="text-center p-5 text-white-50">
                                {viewMode === 'likes' ? 'Aún no has dado like a ninguna canción 💔' : 'No hay canciones disponibles.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* REPRODUCTOR */}
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