import React, { useEffect, useState, useRef } from 'react';

// ==========================================
// 1. AUTH & LOGIN
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
                    <h6 className="mb-4 text-white-50 text-uppercase small ls-2">
                        {isLoginView ? 'Bienvenido de nuevo' : 'Crea tu cuenta gratis'}
                    </h6>
                    <form onSubmit={handleSubmit} className="text-start">
                        <div className="form-floating mb-3">
                            <input type="text" className="form-control" id="floatingInput" placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} required />
                            <label htmlFor="floatingInput">Nombre de usuario</label>
                        </div>
                        <div className="form-floating mb-4">
                            <input type="password" className="form-control" id="floatingPassword" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            <label htmlFor="floatingPassword">Contraseña</label>
                        </div>
                        <div className="d-grid gap-2">
                            <button type="submit" className="btn btn-spotify">
                                {isLoginView ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
                            </button>
                        </div>
                    </form>
                    <div className="mt-4 pt-3 border-top border-secondary">
                        <button className="link-spotify small" onClick={() => setIsLoginView(!isLoginView)}>
                            {isLoginView ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 2. SMART ADD MODAL
// ==========================================
function SmartAddModal({ onClose, onSave }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [form, setForm] = useState({ titulo: '', artista: '', album: '', duracion: '', url: '' });

    const detectDuration = (url) => {
        if (!url) return;
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
            const mins = Math.floor(audio.duration / 60);
            const secs = Math.floor(audio.duration % 60);
            setForm(prev => ({ ...prev, duracion: `${mins}:${secs < 10 ? '0' : ''}${secs}` }));
        };
    };

    const searchItunes = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&limit=5`);
            const data = await res.json();
            setResults(data.results);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const selectSong = (track) => {
        const mins = Math.floor(track.trackTimeMillis / 60000);
        const secs = ((track.trackTimeMillis % 60000) / 1000).toFixed(0);
        const dur = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        onSave({
            titulo: track.trackName,
            artista: track.artistName,
            album: track.collectionName,
            duracion: dur,
            url: track.previewUrl
        });
        onClose();
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        onSave(form);
        onClose();
    };

    return (
        <div className="modal d-block fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 11000 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content card-glass border-secondary shadow-lg">
                    <div className="modal-header border-bottom border-secondary">
                        <h5 className="modal-title text-success"><i className="bi bi-magic me-2"></i>Agregar Canción Inteligente</h5>
                        <button className="btn btn-link text-white text-decoration-none fs-4 p-0" onClick={onClose}><i className="bi bi-x-lg"></i></button>
                    </div>
                    <div className="modal-body p-4">
                        {!manualMode ? (
                            <>
                                <div className="input-group mb-4">
                                    <input 
                                        type="text" 
                                        className="form-control bg-dark text-white border-secondary" 
                                        placeholder="Busca en iTunes (ej. 'Bohemian Rhapsody')..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && searchItunes()}
                                        autoFocus
                                    />
                                    <button className="btn btn-spotify" onClick={searchItunes}>
                                        {loading ? '...' : 'Buscar'}
                                    </button>
                                </div>

                                {results.length > 0 && (
                                    <div className="list-group mb-3">
                                        {results.map(track => (
                                            <button key={track.trackId} className="list-group-item list-group-item-action bg-dark text-white border-secondary d-flex align-items-center gap-3 p-3" onClick={() => selectSong(track)}>
                                                <img src={track.artworkUrl60} alt="cover" className="rounded shadow-sm" />
                                                <div className="flex-grow-1 text-start">
                                                    <div className="fw-bold text-white">{track.trackName}</div>
                                                    <div className="small text-muted">{track.artistName} • {track.collectionName}</div>
                                                </div>
                                                <i className="bi bi-plus-circle-fill text-success fs-4"></i>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="text-center mt-4">
                                    <button className="btn btn-link text-white-50 text-decoration-none small" onClick={() => setManualMode(true)}>No lo encuentro, ingresar manualmente</button>
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handleManualSubmit}>
                                <div className="row g-3">
                                    <div className="col-md-6"><input className="form-control bg-dark text-white border-secondary" placeholder="Título" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} required /></div>
                                    <div className="col-md-6"><input className="form-control bg-dark text-white border-secondary" placeholder="Artista" value={form.artista} onChange={e => setForm({...form, artista: e.target.value})} required /></div>
                                    <div className="col-md-6"><input className="form-control bg-dark text-white border-secondary" placeholder="Álbum" value={form.album} onChange={e => setForm({...form, album: e.target.value})} /></div>
                                    
                                    <div className="col-12">
                                        <div className="input-group">
                                            <input 
                                                className="form-control bg-dark text-white border-secondary" 
                                                placeholder="URL Audio (mp3) - Pega para auto-detectar duración" 
                                                value={form.url} 
                                                onChange={e => {
                                                    setForm({...form, url: e.target.value});
                                                    detectDuration(e.target.value); 
                                                }} 
                                            />
                                            <span className="input-group-text bg-secondary border-secondary text-white"><i className="bi bi-music-note"></i></span>
                                        </div>
                                    </div>
                                    
                                    <div className="col-md-3">
                                        <input 
                                            className="form-control bg-dark text-white border-secondary" 
                                            placeholder="Duración (Auto)" 
                                            value={form.duracion} 
                                            onChange={e => setForm({...form, duracion: e.target.value})} 
                                            readOnly={!!form.url} 
                                        />
                                    </div>

                                    <div className="col-12 d-flex justify-content-between mt-4">
                                        <button type="button" className="btn btn-outline-light btn-sm" onClick={() => setManualMode(false)}>Volver</button>
                                        <button type="submit" className="btn btn-success px-4">Guardar</button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 3. EDIT FORM (Inline)
// ==========================================
function EditForm({ cancion, API_URL, authHeaders, onSave, onCancel }) {
    const [data, setData] = useState({ ...cancion });

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/canciones/${cancion.id}`, {
                method: 'PUT', headers: authHeaders, body: JSON.stringify(data),
            });
            if (res.ok) onSave();
        } catch (error) { console.error('Error:', error); }
    };

    return (
        <div className="song-row p-2 bg-dark border border-success rounded mb-2 fade-in">
            <form onSubmit={handleUpdate} className="d-flex align-items-center gap-2 flex-wrap">
                <input className="form-control form-control-sm bg-secondary text-white border-0" value={data.titulo} onChange={(e) => setData({...data, titulo: e.target.value})} placeholder="Título" style={{flex: 2}} />
                <input className="form-control form-control-sm bg-secondary text-white border-0" value={data.artista} onChange={(e) => setData({...data, artista: e.target.value})} placeholder="Artista" style={{flex: 2}} />
                <input className="form-control form-control-sm bg-secondary text-white border-0" value={data.album} onChange={(e) => setData({...data, album: e.target.value})} placeholder="Álbum" style={{flex: 1}} />
                <button type="submit" className="btn btn-success btn-sm"><i className="bi bi-check-lg"></i></button>
                <button type="button" className="btn btn-outline-light btn-sm" onClick={onCancel}><i className="bi bi-x-lg"></i></button>
            </form>
        </div>
    );
}

// ==========================================
// 4. REPRODUCTOR (Bottom Player)
// ==========================================
const BottomPlayer = ({ currentSong, isPlaying, onTogglePlay, onNext, onPrev, isLiked, onToggleLike }) => {
    const audioRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState("0:00");

    useEffect(() => {
        if (currentSong && audioRef.current) {
            const audioSrc = currentSong.url || currentSong.tempUrl; 
            if (audioSrc && audioRef.current.src !== audioSrc) audioRef.current.src = audioSrc;
            if (isPlaying) audioRef.current.play().catch(e => console.error("Error play:", e));
            else audioRef.current.pause();
        }
    }, [currentSong, isPlaying]);

    useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

    const handleTimeUpdate = () => {
        const current = audioRef.current.currentTime;
        const duration = audioRef.current.duration || 1;
        setProgress((current / duration) * 100);
        const mins = Math.floor(current / 60);
        const secs = Math.floor(current % 60);
        setCurrentTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    };

    const handleSeek = (e) => {
        const progressBar = e.target;
        const clickPosition = (e.nativeEvent.offsetX / progressBar.offsetWidth);
        const newTime = clickPosition * audioRef.current.duration;
        audioRef.current.currentTime = newTime;
    };

    const handleVolumeChange = (e) => setVolume(parseFloat(e.target.value));

    if (!currentSong) return null;

    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return `hsl(${hash % 360}, 60%, 50%)`;
    };
    const coverColor = stringToColor(currentSong.titulo);

    return (
        <div className="bottom-player fade-in d-flex align-items-center justify-content-between px-4" style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, height: '90px', 
            background: '#181818', borderTop: '1px solid #282828', zIndex: 12000 
        }}>
            <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={() => onTogglePlay()} />
            
            {/* Info */}
            <div className="d-flex align-items-center" style={{width: '30%'}}>
                <div className="me-3 rounded d-flex align-items-center justify-content-center shadow-sm" style={{width: '56px', height: '56px', background: coverColor}}>
                    <i className="bi bi-music-note-beamed text-white fs-4"></i>
                </div>
                <div className="text-truncate">
                    <div className="text-white fw-bold">{currentSong.titulo}</div>
                    <div className="text-muted small">{currentSong.artista}</div>
                </div>
                {/* Botón Like Interactivo */}
                <button 
                    className={`btn btn-link ms-2 ${isLiked ? 'text-danger' : 'text-muted'}`} 
                    onClick={() => onToggleLike(currentSong)}
                    title={isLiked ? "Quitar de Me gusta" : "Añadir a Me gusta"}
                >
                    <i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                </button>
            </div>

            {/* Controles Centrales */}
            <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1" style={{maxWidth: '500px'}}>
                <div className="d-flex gap-3 align-items-center mb-1">
                    <button className="btn btn-link text-white-50 p-0 hover-white" title="Aleatorio"><i className="bi bi-shuffle"></i></button>
                    {/* Botón Anterior */}
                    <button className="btn btn-link text-white-50 p-0 fs-4 hover-white" onClick={onPrev} title="Anterior"><i className="bi bi-skip-start-fill"></i></button>
                    
                    <button className="btn btn-white bg-white text-black rounded-circle d-flex align-items-center justify-content-center shadow hover-scale" style={{width: '35px', height: '35px', border: 'none'}} onClick={onTogglePlay}>
                        <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'} fs-5`}></i>
                    </button>
                    
                    {/* Botón Siguiente */}
                    <button className="btn btn-link text-white-50 p-0 fs-4 hover-white" onClick={onNext} title="Siguiente"><i className="bi bi-skip-end-fill"></i></button>
                    <button className="btn btn-link text-white-50 p-0 hover-white" title="Repetir"><i className="bi bi-repeat"></i></button>
                </div>
                
                {/* Barra de Progreso Interactiva */}
                <div className="w-100 d-flex align-items-center gap-2 small text-muted">
                    <span style={{minWidth: '35px', textAlign:'right'}}>{currentTime}</span>
                    <div className="progress flex-grow-1" style={{height: '4px', backgroundColor: '#555', cursor: 'pointer'}} onClick={handleSeek}>
                        <div className="progress-bar bg-white" style={{width: `${progress}%`}}></div>
                    </div>
                    <span style={{minWidth: '35px'}}>{currentSong.isPreview ? '0:30' : (currentSong.duracion || '--:--')}</span>
                </div>
            </div>

            {/* Volumen Interactivo */}
            <div className="d-flex align-items-center justify-content-end gap-2" style={{width: '30%'}}>
                <i className="bi bi-mic text-white-50 hover-white cursor-pointer" title="Letra"></i>
                <div className="d-flex align-items-center gap-2" style={{width: '120px'}}>
                    <i className={`bi ${volume === 0 ? 'bi-volume-mute' : volume < 0.5 ? 'bi-volume-down' : 'bi-volume-up'} text-white-50`}></i>
                    <input 
                        type="range" 
                        min="0" max="1" step="0.01" 
                        value={volume} 
                        onChange={handleVolumeChange}
                        className="form-range" 
                        style={{height: '4px'}}
                    />
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 5. MAIN APP
// ==========================================
function App() {
  const [canciones, setCanciones] = useState([]);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : { token: null, role: 'guest', username: null };
  });

  // UI States
  const [view, setView] = useState('home'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // DATOS REALES (DB)
  const [allPlaylists, setAllPlaylists] = useState([]);
  const [likedSongsIds, setLikedSongsIds] = useState([]);

  // Player
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Modals UI
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [currentSongTitle, setCurrentSongTitle] = useState('');
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [songToAdd, setSongToAdd] = useState(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false); 
  const [isSearchingAudio, setIsSearchingAudio] = useState(false);

  const isAdmin = user.role === 'admin';
  const isLoggedIn = !!user.token;
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const AUTH_URL = API_URL;

  // Persistencia de Usuario
  useEffect(() => { localStorage.setItem('user', JSON.stringify(user)); }, [user]);

  const getAuthHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` });

// ==========================================
// CÓDIGO CORREGIDO (fetchData)
// ==========================================
const fetchData = () => {
    // 1. Canciones (Con protección contra errores)
    fetch(API_URL + '/canciones')
        .then(r => {
            if (!r.ok) throw new Error("Error en el servidor");
            return r.json();
        })
        .then(d => {
            if (Array.isArray(d)) {
                setCanciones(d);
            } else {
                console.error("Los datos recibidos no son un array:", d);
                setCanciones([]); // Evita el crash usando una lista vacía
            }
        })
        .catch(e => {
            console.error("Error al cargar canciones:", e);
            setCanciones([]); // En caso de error, usa lista vacía
        });
    
    // ... el resto de tu código (playlists y likes) sigue igual ...
    if (isLoggedIn) {
        fetch(API_URL + '/playlists', { headers: getAuthHeaders() }).then(r => r.json()).then(d => setAllPlaylists(d)).catch(e => console.error(e));
        fetch(API_URL + '/likes', { headers: getAuthHeaders() }).then(r => r.json()).then(d => setLikedSongsIds(d)).catch(e => console.error(e));
    }
};

  // --- ACTIONS ---
  // Toggle Like
  const toggleLike = async (song) => {
      try {
          const res = await fetch(API_URL + '/likes', {
              method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ song_id: song.id })
          });
          const data = await res.json();
          if (data.liked) setLikedSongsIds([...likedSongsIds, song.id]);
          else setLikedSongsIds(likedSongsIds.filter(id => id !== song.id));
          
          fetchData(); // Recargar playlists para ver cambios en "Me Gusta"
      } catch (e) { console.error(e); }
  };

  const handleCreateSong = async (songData) => {
      try {
          await fetch(API_URL + '/canciones', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(songData) });
          fetchData();
      } catch (e) { alert("Error guardando"); }
  };

  const playSong = async (song) => {
      if(song.url || song.tempUrl) { setCurrentSong(song); setIsPlaying(true); return; }
      try {
          setIsSearchingAudio(true);
          const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(song.artista + ' ' + song.titulo)}&media=music&limit=1`);
          const data = await res.json();
          if(data.results?.[0]?.previewUrl) {
              const playable = { ...song, url: data.results[0].previewUrl, tempUrl: data.results[0].previewUrl, isPreview: true };
              setCurrentSong(playable); setIsPlaying(true);
          } else { alert("No se encontró audio."); }
      } catch (e) { console.error(e); } finally { setIsSearchingAudio(false); }
  };

  const handleNext = () => {
      if(!currentSong) return;
      const list = (view === 'playlist_detail' && selectedPlaylist) ? selectedPlaylist.songs : canciones;
      const currentIndex = list.findIndex(c => c.id === currentSong.id);
      if(currentIndex >= 0 && currentIndex < list.length - 1) playSong(list[currentIndex + 1]);
  };

  const handlePrev = () => {
      if(!currentSong) return;
      const list = (view === 'playlist_detail' && selectedPlaylist) ? selectedPlaylist.songs : canciones;
      const currentIndex = list.findIndex(c => c.id === currentSong.id);
      if(currentIndex > 0) playSong(list[currentIndex - 1]);
  };

  const handleSearchLyrics = async (artist, title) => {
    setLoadingLyrics(true); setShowLyricsModal(true); setCurrentSongTitle(title); setLyrics('Buscando...');
    try {
        const res = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`);
        const data = await res.json(); setLyrics(data.lyrics || 'Letra no encontrada.');
    } catch { setLyrics('Error buscando letra.'); } finally { setLoadingLyrics(false); }
  };

  const createPlaylist = async () => {
      const name = prompt("Nombre de la playlist:");
      if(name) {
          try {
              await fetch(API_URL + '/playlists', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ name }) });
              fetchData();
          } catch(e) { console.error(e); }
      }
  };

  const addToPlaylist = async (playlistId, song) => {
      try {
          await fetch(`${API_URL}/playlists/${playlistId}/songs`, { 
              method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ song_id: song.id }) 
          });
          setShowAddToPlaylistModal(false);
          fetchData();
      } catch(e) { alert("Error añadiendo a playlist"); }
  };

  const deletePlaylist = async (id) => {
      if(window.confirm("¿Borrar playlist?")) {
          try {
              await fetch(`${API_URL}/playlists/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
              fetchData();
          } catch(e) { console.error(e); }
      }
  };

  const removeSongFromPlaylist = async (pid, sid) => {
      try {
          await fetch(`${API_URL}/playlists/${pid}/songs/${sid}`, { method: 'DELETE', headers: getAuthHeaders() });
          // Actualizamos la vista local si estamos viendo esa playlist
          if(selectedPlaylist && selectedPlaylist.id === pid) {
              const updatedSongs = selectedPlaylist.songs.filter(s => s.id !== sid);
              setSelectedPlaylist({...selectedPlaylist, songs: updatedSongs});
          }
          fetchData();
      } catch(e) { console.error(e); }
  };

  const handleAuth = async (isLogin, creds) => {
      const endpoint = isLogin ? 'login' : 'register';
      try {
          const res = await fetch(`${AUTH_URL}/${endpoint}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(creds) });
          const data = await res.json();
          if(!res.ok) throw new Error(data.error);
          if(isLogin) setUser({ token: data.token, role: data.role, username: data.username });
          else alert("Registrado. Inicia sesión.");
      } catch (e) { alert(e.message); }
  };
  const handleLogout = () => { localStorage.removeItem('user'); setUser({ token: null, role: 'guest', username: null }); };
  const handleDelete = async (id) => { if(!isAdmin) return; if(window.confirm("¿Eliminar?")) try { await fetch(`${API_URL}/canciones/${id}`, { method: 'DELETE', headers: getAuthHeaders() }); fetchData(); } catch(e){console.error(e);} };
  
  // FUNCIONES DE EXPORTAR
  const openInYoutube = () => {
      if(!selectedPlaylist) return;
      const query = selectedPlaylist.songs.map(s => `${s.artista} ${s.titulo}`).join(' ');
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      window.open(url, '_blank');
  };
  const openInSpotify = () => {
      if(!selectedPlaylist) return;
      const query = selectedPlaylist.songs.map(s => `${s.artista} ${s.titulo}`).join(' OR ');
      const url = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
      window.open(url, '_blank');
  };
  const copyPlaylistToClipboard = () => {
      if(!selectedPlaylist) return;
      const text = selectedPlaylist.songs.map(s => `${s.artista} - ${s.titulo}`).join('\n');
      navigator.clipboard.writeText(text);
      alert("Lista copiada!");
      setShowExportModal(false);
  };

const togglePlaylistPrivacy = async (id) => {
    // 1. Encontrar la playlist
    const playlist = allPlaylists.find(p => p.id === id);
    if (!playlist) return;

    // 2. Calcular el nuevo valor
    const newPrivacyState = !playlist.isPublic;

    // 3. Actualización Optimista (Actualizar la UI inmediatamente para que se sienta rápido)
    setAllPlaylists(prev => prev.map(p => 
        (p.id === id && p.owner === user.username) 
            ? { ...p, isPublic: newPrivacyState } 
            : p
    ));

    // 4. Enviar el cambio a la base de datos
    try {
        const res = await fetch(`${API_URL}/playlists/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                name: playlist.name, // A veces el backend pide el objeto completo
                isPublic: newPrivacyState 
            }) 
        });

        if (!res.ok) throw new Error("Error al guardar en el servidor");
        
        // Opcional: Si el servidor devuelve la playlist actualizada, puedes usar fetchData()
        // fetchData(); 

    } catch (error) {
        console.error("Error cambiando privacidad:", error);
        alert("No se pudo guardar el cambio. Revisa tu conexión.");
        // Revertir el cambio visual si falló el servidor
        setAllPlaylists(prev => prev.map(p => 
            p.id === id ? { ...p, isPublic: !newPrivacyState } : p
        ));
    }
};
const removeSongFromPlaylistAction = (pid, sid) => {
    if (window.confirm("¿Seguro que quieres quitar esta canción de la lista?")) {
        removeSongFromPlaylist(pid, sid);
    }
};

  const userPlaylists = allPlaylists; 
  const displaySongs = searchTerm 
      ? canciones.filter(c => c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || c.artista.toLowerCase().includes(searchTerm.toLowerCase()))
      : canciones.slice(-5).reverse();

  // --- COMPONENTE ITEM (REUTILIZABLE) ---
  const CancionItem = ({ cancion, index, isPlaylistView = false, playlistId = null, playlistOwner = null }) => { 
    if (cancion.id === editingId) return <EditForm cancion={cancion} API_URL={API_URL} authHeaders={getAuthHeaders('PUT')} onSave={() => { setEditingId(null); fetchData(); }} onCancel={() => setEditingId(null)} />;

    const youtubeLink = `https://www.youtube.com/results?search_query=${cancion.artista}+${cancion.titulo}`;
    const spotifyLink = `https://open.spotify.com/search/${cancion.artista} ${cancion.titulo}`;
    const stringToColor = (str) => { let hash = 0; for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash); return `hsl(${hash % 360}, 70%, 40%)`; };
    const coverColor = stringToColor(cancion.titulo + cancion.artista);
    const isPlayingThis = currentSong?.id === cancion.id;
    const isMyPlaylist = isPlaylistView && playlistOwner === user.username;
    const isLoadingThis = isSearchingAudio && isPlayingThis;
    const isLiked = likedSongsIds.includes(cancion.id);

    return (
      <div className={`song-row d-flex align-items-center justify-content-between mb-2 p-2 hover-bg text-white border-bottom border-secondary fade-in ${isPlayingThis ? 'bg-dark border-success' : ''}`} 
           onDoubleClick={() => playSong(cancion)}>
        
        <div className="d-flex align-items-center flex-grow-1" style={{minWidth: '200px', overflow: 'hidden'}}>
            <span className={`text-muted me-3 d-flex justify-content-center ${isPlayingThis ? 'text-success' : ''}`} style={{ width: '20px' }}>
                {isPlayingThis ? <i className="bi bi-soundwave fs-5"></i> : index + 1}
            </span>
            <div className="cover-art me-3 shadow-sm" style={{ background: coverColor }}>
                <div className="cover-art-overlay" onClick={() => playSong(cancion)}>
                    {isLoadingThis ? <div className="spinner-border spinner-border-sm text-white"></div> : <i className="bi bi-play-fill text-white fs-3"></i>}
                </div>
                {!isPlayingThis && (<div className="d-flex align-items-center justify-content-center h-100 w-100"><i className="bi bi-music-note text-white-50"></i></div>)}
            </div>
            <div style={{overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>
                <h6 className={`mb-0 fw-bold ${isPlayingThis ? 'text-success' : 'text-white'}`}>{cancion.titulo}</h6>
                <small className="text-white-50">{cancion.artista}</small>
            </div>
        </div>

        <div className="d-flex align-items-center gap-2 opacity-75">
            <button className={`btn btn-sm btn-link ${isLiked ? 'text-danger' : 'text-secondary hover-white'}`} onClick={() => toggleLike(cancion)} title="Me Gusta"><i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}`}></i></button>
            <button className="btn btn-sm btn-link text-secondary hover-white" onClick={() => handleSearchLyrics(cancion.artista, cancion.titulo)} title="Letra"><i className="bi bi-mic"></i></button>
            <a href={youtubeLink} target="_blank" rel="noreferrer" className="btn btn-link text-danger p-1 hover-white" title="YouTube"><i className="bi bi-youtube"></i></a>
            <a href={spotifyLink} target="_blank" rel="noreferrer" className="btn btn-link text-success p-1 hover-white" title="Spotify"><i className="bi bi-spotify"></i></a>
            {!isPlaylistView && <button className="btn btn-link text-secondary hover-white" onClick={() => {setSongToAdd(cancion); setShowAddToPlaylistModal(true);}} title="Agregar a Playlist"><i className="bi bi-plus-circle"></i></button>}
            {isMyPlaylist && <button className="btn btn-link text-secondary hover-danger" onClick={() => removeSongFromPlaylistAction(playlistId, cancion.id)} title="Quitar"><i className="bi bi-x-circle"></i></button>}
            {!isPlaylistView && isLoggedIn && isAdmin && (
                <div className="d-flex gap-1 ms-2 border-start border-secondary ps-2">
                    <button className="btn btn-link text-secondary hover-info p-1" onClick={() => setEditingId(cancion.id)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-link text-secondary hover-danger p-1" onClick={() => handleDelete(cancion.id)}><i className="bi bi-trash"></i></button>
                </div>
            )}
            <div className="text-muted ms-3 small d-none d-md-block" style={{minWidth: '40px'}}>{cancion.duracion}</div>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) return <LoginAuth onAuthSubmit={handleAuth} />;

  return (
    <div className="bg-black text-white min-vh-100 position-relative pb-5">
      <BottomPlayer currentSong={currentSong} isPlaying={isPlaying} onTogglePlay={() => setIsPlaying(!isPlaying)} onNext={handleNext} onPrev={handlePrev} isLiked={currentSong ? likedSongsIds.includes(currentSong.id) : false} onToggleLike={toggleLike} />
      {showAddModal && <SmartAddModal onClose={() => setShowAddModal(false)} onSave={handleCreateSong} />}
      
      {/* MODALES */}
      {showLyricsModal && (
        <div className="modal d-block fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 11000 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content bg-dark text-white border-secondary shadow-lg">
                <div className="modal-header border-bottom border-secondary">
                    <h5 className="modal-title text-success"><i className="bi bi-mic me-2"></i>{currentSongTitle}</h5>
                    <button className="btn btn-link text-white text-decoration-none p-0" onClick={() => setShowLyricsModal(false)}><i className="bi bi-x-lg"></i></button>
                </div>
                <div className="modal-body text-center p-4 fs-5 lh-lg" style={{whiteSpace: 'pre-line'}}>
                    {loadingLyrics ? <div className="spinner-border text-success"></div> : lyrics}
                </div>
            </div>
          </div>
        </div>
      )}

      {showAddToPlaylistModal && songToAdd && (
        <div className="modal d-block fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 11000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content card-glass border-secondary shadow-lg">
                <div className="modal-header border-secondary">
                    <h5 className="modal-title text-white">Agregar a Playlist</h5>
                    <button className="btn btn-link text-white text-decoration-none fs-4 p-0" onClick={() => setShowAddToPlaylistModal(false)}><i className="bi bi-x-lg"></i></button>
                </div>
                <div className="modal-body p-0">
                    <div className="list-group list-group-flush">
                        {userPlaylists.length > 0 ? userPlaylists.map(p => (
                            <button key={p.id} className="list-group-item list-group-item-action bg-transparent text-white border-secondary p-3 d-flex justify-content-between" onClick={() => addToPlaylist(p.id, songToAdd)}>
                                <span className="fw-bold"><i className="bi bi-music-note-list me-2 text-success"></i> {p.name}</span>
                                <span className="badge bg-secondary rounded-pill">{p.songs.length}</span>
                            </button>
                        )) : <div className="p-4 text-center"><button className="btn btn-spotify" onClick={() => {setShowAddToPlaylistModal(false); createPlaylist();}}>Crear Nueva Playlist</button></div>}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPORTAR PLAYLIST */}
      {showExportModal && selectedPlaylist && (
        <div className="modal d-block fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 11000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content card-glass border-secondary shadow-lg">
                <div className="modal-header border-secondary">
                    <h5 className="modal-title text-white">Exportar Playlist</h5>
                    <button className="btn btn-link text-white text-decoration-none fs-4 p-0" onClick={() => setShowExportModal(false)}><i className="bi bi-x-lg"></i></button>
                </div>
                <div className="modal-body p-4 text-center">
                    <p className="text-white-50 mb-4">Elige cómo quieres transferir tu playlist <strong>{selectedPlaylist.name}</strong>:</p>
                    <div className="d-grid gap-3">
                        <button className="btn btn-danger py-2" onClick={openInYoutube}>
                            <i className="bi bi-youtube me-2"></i> Abrir Búsqueda en YouTube
                        </button>
                        <button className="btn btn-success py-2" onClick={openInSpotify}>
                            <i className="bi bi-spotify me-2"></i> Abrir Búsqueda en Spotify
                        </button>
                        <button className="btn btn-outline-light py-2" onClick={copyPlaylistToClipboard}>
                            <i className="bi bi-clipboard me-2"></i> Copiar Lista (Texto)
                        </button>
                    </div>
                    <div className="mt-3">
                        <small className="text-muted">Si quieres migrar automáticamente, usa la opción de copiar y pega en <a href="https://www.tunemymusic.com/es/" target="_blank" rel="noreferrer" className="text-success">TuneMyMusic</a>.</small>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="navbar navbar-dark bg-black sticky-top px-4 py-3" style={{ borderBottom: '1px solid #222', zIndex: 1000 }}>
          <div className="d-flex align-items-center gap-4">
             <div className="d-flex align-items-center cursor-pointer text-white" onClick={() => {setView('home'); setSearchTerm(''); setSelectedPlaylist(null);}}>
                 <i className="bi bi-soundwave text-success fs-3 me-2"></i>
                 <span className="fw-bold fs-4">Música Local</span>
             </div>
             <div className="position-relative d-none d-md-block" style={{width: '380px'}}>
                 <i className="bi bi-search position-absolute text-muted" style={{top: '10px', left: '15px'}}></i>
                 <input className="form-control bg-dark border-0 text-white rounded-pill ps-5 py-2" placeholder="¿Qué quieres escuchar hoy?" value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setView(e.target.value ? 'home' : 'home');}} />
             </div>
          </div>
          <div className="d-flex gap-3 align-items-center">
              {isAdmin && <button className="btn btn-outline-light rounded-pill btn-sm px-3 fw-bold" onClick={() => setShowAddModal(true)}>+ Canción</button>}
              <div className="text-end lh-1 d-none d-sm-block">
                  <div className="fw-bold small">{user.username}</div>
                  <div className="badge bg-secondary" style={{fontSize: '0.65rem'}}>{user.role}</div>
              </div>
              <button onClick={handleLogout} className="btn btn-link text-white-50"><i className="bi bi-box-arrow-right fs-5"></i></button>
          </div>
      </nav>

      <div className="container mt-4" style={{paddingBottom: '120px'}}>
        
        {/* VISTA 1: DETALLE DE PLAYLIST */}
        {view === 'playlist_detail' && selectedPlaylist && (
            <div className="fade-in">
                <button className="btn btn-link text-muted text-decoration-none mb-3 p-0" onClick={() => setView('home')}><i className="bi bi-arrow-left me-1"></i>Volver</button>
                <div className="d-flex align-items-end gap-4 mb-4 pb-4 border-bottom border-secondary">
                    <div className="bg-dark border border-secondary d-flex align-items-center justify-content-center rounded shadow-lg" style={{width: '200px', height: '200px', background: 'linear-gradient(45deg, #333, #111)'}}>
                        {selectedPlaylist.name.includes("Me Gusta") ? <i className="bi bi-heart-fill display-1 text-danger"></i> : <i className="bi bi-music-note-list display-1 text-secondary opacity-50"></i>}
                    </div>
                    <div>
                        <small className="text-uppercase fw-bold text-white">Playlist</small>
                        <h1 className="fw-bold mb-2 display-4">{selectedPlaylist.name}</h1>
                        <p className="text-white-50 m-0">{selectedPlaylist.owner} • {selectedPlaylist.songs.length} canciones</p>
                        <div className="mt-3 d-flex gap-2">
                            <button className="btn btn-success rounded-pill px-4 fw-bold" onClick={() => {if(selectedPlaylist.songs.length > 0) playSong(selectedPlaylist.songs[0])}}>
                                <i className="bi bi-play-fill me-1"></i> Reproducir
                            </button>
                            <button className="btn btn-outline-light rounded-pill px-4" onClick={() => setShowExportModal(true)}>
                                <i className="bi bi-box-arrow-up me-2"></i> Transferir
                            </button>
                        </div>
                    </div>
                </div>
                <div className="list-group list-group-flush">
                    {selectedPlaylist.songs.map((c, i) => (
                        <CancionItem key={i} cancion={c} index={i} isPlaylistView={true} playlistId={selectedPlaylist.id} playlistOwner={selectedPlaylist.owner} />
                    ))}
                    {selectedPlaylist.songs.length === 0 && <p className="text-muted py-4">Aún no hay canciones en esta playlist.</p>}
                </div>
            </div>
        )}

        {/* VISTA 2: HOME & BÚSQUEDA */}
        {view === 'home' && (
            <div className="fade-in">
                {searchTerm ? (
                    <>
                        <h5 className="mb-3">Resultados para "{searchTerm}"</h5>
                        <div className="list-group">
                            {displaySongs.map(c => <CancionItem key={c.id} cancion={c} index={0} />)}
                            {displaySongs.length === 0 && <p className="text-muted">No se encontraron resultados.</p>}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="d-flex justify-content-between align-items-end mb-3">
                            <h4 className="fw-bold m-0">Mis Playlists</h4>
                            <button className="btn btn-link text-white-50 text-decoration-none small" onClick={createPlaylist}>Crear Nueva</button>
                        </div>
                        <div className="row g-3 mb-5">
                            {userPlaylists.map(p => (
                                <div key={p.id} className="col-6 col-md-3 col-lg-2">
                                    <div className="card bg-dark border-secondary h-100 hover-bg cursor-pointer card-glass" onClick={() => {setSelectedPlaylist(p); setView('playlist_detail');}}>
                                        <div className="card-body p-3 d-flex flex-column align-items-center justify-content-center text-center" style={{minHeight: '140px'}}>
                                            {p.name.includes("Me Gusta") ? <i className="bi bi-heart-fill fs-1 text-danger mb-3"></i> : <i className="bi bi-music-note-list fs-1 text-white-50 mb-3"></i>}
                                            <div className="fw-bold text-white text-truncate w-100">{p.name}</div>
                                            <div className="small text-muted">{p.songs.length} canciones</div>
                                        </div>
                                        {!p.name.includes("Me Gusta") && (
                                            <div className="card-footer bg-transparent border-top border-secondary py-1 text-center">
                                                <button className="btn btn-link text-danger p-0 btn-sm" onClick={(e) => {e.stopPropagation(); deletePlaylist(p.id);}} style={{fontSize:'0.7rem'}}>Eliminar</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {userPlaylists.length === 0 && <div className="col-12 text-muted small fst-italic">No tienes playlists creadas.</div>}
                        </div>

                        <h4 className="fw-bold mb-3">Nuevas en la Biblioteca</h4>
                        <div className="list-group">
                            {displaySongs.map((c, i) => <CancionItem key={c.id} cancion={c} index={i} />)}
                        </div>
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
}

export default App;