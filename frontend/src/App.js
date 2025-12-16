import React, { useEffect, useState, useRef } from 'react';

// ==========================================
// COMPONENTE 1: LOGIN / REGISTRO
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
// COMPONENTE 2: EDICIÓN
// ==========================================
function EditForm({ cancion, API_URL, authHeaders, onSave, onCancel }) {
    const [editTitle, setEditTitle] = useState(cancion.titulo);
    const [editArtista, setEditArtista] = useState(cancion.artista);
    const [editDuracion, setEditDuracion] = useState(cancion.duracion);
    const [editAlbum, setEditAlbum] = useState(cancion.album || ''); 
    const [editUrl, setEditUrl] = useState(cancion.url || ''); 

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/canciones/${cancion.id}`, {
                method: 'PUT', headers: authHeaders,
                body: JSON.stringify({ titulo: editTitle, artista: editArtista, duracion: editDuracion, album: editAlbum, url: editUrl }),
            });
            if (response.ok) onSave();
            else alert('Error al actualizar.');
        } catch (error) { console.error('Error:', error); }
    };

    return (
        <div className="song-row p-3 bg-dark border border-success rounded mb-2 fade-in">
            <form onSubmit={handleUpdate} className="d-flex align-items-center gap-2 flex-wrap">
                <input type="text" className="form-control form-control-sm" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Título" style={{flex: 2}} />
                <input type="text" className="form-control form-control-sm" value={editArtista} onChange={(e) => setEditArtista(e.target.value)} placeholder="Artista" style={{flex: 2}} />
                <input type="text" className="form-control form-control-sm" value={editAlbum} onChange={(e) => setEditAlbum(e.target.value)} placeholder="Álbum" style={{flex: 1}} />
                <input type="text" className="form-control form-control-sm" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="URL Audio (mp3)" style={{flex: 2}} />
                <input type="text" className="form-control form-control-sm" value={editDuracion} onChange={(e) => setEditDuracion(e.target.value)} placeholder="Dur." style={{flex: 0.5}} />
                <button type="submit" className="btn btn-success btn-sm"><i className="bi bi-check-lg"></i></button>
                <button type="button" className="btn btn-outline-light btn-sm" onClick={onCancel}><i className="bi bi-x-lg"></i></button>
            </form>
        </div>
    );
}

// ==========================================
// COMPONENTE 3: REPRODUCTOR INFERIOR
// ==========================================
const BottomPlayer = ({ currentSong, isPlaying, onTogglePlay }) => {
    const audioRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState("0:00");

    useEffect(() => {
        if (currentSong && audioRef.current) {
            // Usamos la URL encontrada dinámicamente o la manual
            const audioSrc = currentSong.tempUrl || currentSong.url; 
            
            if (audioSrc && audioRef.current.src !== audioSrc) {
                audioRef.current.src = audioSrc;
            }

            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Error reproducción:", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [currentSong, isPlaying]);

    const handleTimeUpdate = () => {
        const current = audioRef.current.currentTime;
        const duration = audioRef.current.duration || 1;
        setProgress((current / duration) * 100);
        
        const mins = Math.floor(current / 60);
        const secs = Math.floor(current % 60);
        setCurrentTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    };

    if (!currentSong) return null;

    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return `hsl(${hash % 360}, 60%, 50%)`;
    };
    const coverColor = stringToColor(currentSong.titulo);

    return (
        <div className="bottom-player fade-in">
            <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={() => onTogglePlay()} />

            {/* Info Canción */}
            <div className="d-flex align-items-center" style={{width: '30%'}}>
                <div style={{width: '56px', height: '56px', background: coverColor, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px', position: 'relative', overflow: 'hidden'}}>
                    {/* Indicador de Preview */}
                    {currentSong.isPreview && <span className="badge bg-warning text-dark position-absolute top-0 start-0" style={{fontSize: '0.6rem'}}>Preview</span>}
                    <i className="bi bi-music-note-beamed text-white fs-4"></i>
                </div>
                <div style={{overflow: 'hidden'}}>
                    <div className="text-white fw-bold text-truncate">{currentSong.titulo}</div>
                    <div className="text-muted small text-truncate">{currentSong.artista}</div>
                </div>
            </div>

            {/* Controles */}
            <div className="d-flex flex-column align-items-center justify-content-center" style={{width: '40%'}}>
                <div className="d-flex align-items-center gap-3 mb-2">
                    <button className="btn btn-link text-white-50"><i className="bi bi-shuffle fs-5"></i></button>
                    <button className="btn btn-white text-black bg-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '35px', height: '35px', border: 'none'}} onClick={onTogglePlay}>
                        <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'} fs-4`}></i>
                    </button>
                    <button className="btn btn-link text-white-50"><i className="bi bi-repeat fs-5"></i></button>
                </div>
                <div className="w-100 d-flex align-items-center gap-2 small text-muted">
                    <span style={{minWidth: '35px', textAlign: 'right'}}>{currentTime}</span>
                    <div className="progress flex-grow-1" style={{height: '4px', backgroundColor: '#555'}}>
                        <div className="progress-bar bg-white" style={{width: `${progress}%`}}></div>
                    </div>
                    {/* Mostramos "0:30" si es preview de iTunes */}
                    <span style={{minWidth: '35px'}}>{currentSong.isPreview ? '0:30' : (currentSong.duracion || '--:--')}</span>
                </div>
            </div>

            {/* Volumen (Visual) */}
            <div className="d-flex align-items-center justify-content-end" style={{width: '30%'}}>
                <i className="bi bi-speaker text-white-50 me-2"></i>
                <div className="progress" style={{width: '80px', height: '4px', backgroundColor: '#555'}}>
                    <div className="progress-bar bg-white" style={{width: '70%'}}></div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// COMPONENTE PRINCIPAL (App)
// ==========================================
function App() {
  const [canciones, setCanciones] = useState([]);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : { token: null, role: 'guest', username: null };
  });

  const [currentSong, setCurrentSong] = useState(null); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSearchingAudio, setIsSearchingAudio] = useState(false); // Estado de carga para audio

  const [titulo, setTitulo] = useState('');
  const [artista, setArtista] = useState('');
  const [duracion, setDuracion] = useState('');
  const [album, setAlbum] = useState('');
  const [url, setUrl] = useState(''); 
  const [editingId, setEditingId] = useState(null); 
  const [lyrics, setLyrics] = useState(''); 
  const [showLyricsModal, setShowLyricsModal] = useState(false); 
  const [loadingLyrics, setLoadingLyrics] = useState(false); 
  const [currentSongTitle, setCurrentSongTitle] = useState(''); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [view, setView] = useState('library'); 
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [songToAdd, setSongToAdd] = useState(null);
  
  const [allPlaylists, setAllPlaylists] = useState(() => {
      const saved = localStorage.getItem('all_playlists_v2'); 
      return saved ? JSON.parse(saved) : [];
  });

  const isAdmin = user.role === 'admin';
  const isLoggedIn = !!user.token;
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'; 
  const AUTH_URL = API_URL; 

  useEffect(() => { localStorage.setItem('user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('all_playlists_v2', JSON.stringify(allPlaylists)); }, [allPlaylists]);

  const userPlaylists = allPlaylists.filter(p => p.owner === user.username);
  const getAuthHeaders = (method = 'GET') => {
    const headers = { 'Content-Type': 'application/json' };
    if (user.token) headers['Authorization'] = `Bearer ${user.token}`;
    return headers;
  };

  // --- LÓGICA REPRODUCTOR INTELIGENTE ---
  const playSong = async (song) => {
      // 1. Si ya tiene URL manual, usarla
      if (song.url) {
          setCurrentSong(song);
          setIsPlaying(true);
          return;
      }

      // 2. Si ya buscamos el preview antes y lo guardamos temporalmente en el objeto song en memoria
      if (song.tempUrl) {
          setCurrentSong(song);
          setIsPlaying(true);
          return;
      }

      // 3. Buscar en API de iTunes
      setIsSearchingAudio(true);
      try {
          const query = encodeURIComponent(`${song.artista} ${song.titulo}`);
          // Usamos iTunes Search API que es pública y gratuita
          const response = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=1`);
          const data = await response.json();

          if (data.results && data.results.length > 0) {
              const previewUrl = data.results[0].previewUrl;
              // Guardamos la URL encontrada en una propiedad temporal del objeto
              const songWithPreview = { ...song, tempUrl: previewUrl, isPreview: true };
              
              // Actualizamos la lista local para no buscar de nuevo esta sesión
              setCanciones(prev => prev.map(s => s.id === song.id ? songWithPreview : s));
              
              setCurrentSong(songWithPreview);
              setIsPlaying(true);
          } else {
              alert(`No se encontró preview para "${song.titulo}". Intenta añadir una URL manualmente.`);
          }
      } catch (error) {
          console.error("Error buscando audio:", error);
          alert("Error de conexión al buscar el audio.");
      } finally {
          setIsSearchingAudio(false);
      }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  // --- FUNCIONES CRUD Y AUTH ---
  const handleAuth = async (isLogin, credentials) => {
    const endpoint = isLogin ? 'login' : 'register';
    try {
        const response = await fetch(`${AUTH_URL}/${endpoint}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error de red.');
        if (isLogin) setUser({ token: data.token, role: data.role, username: data.username });
        else alert('Registro exitoso. Inicia sesión.');
    } catch (error) { alert(`Error: ${error.message}`); }
  };

  const handleLogout = () => { localStorage.removeItem('user'); setUser({ token: null, role: 'guest', username: null }); };
  const fetchCanciones = () => {
    fetch(API_URL + '/canciones').then((res) => res.json()).then((data) => setCanciones(data)).catch((error) => console.error('Error:', error));
  };
  useEffect(() => { fetchCanciones(); }, [API_URL, user.token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert("Acceso denegado.");
    try {
      await fetch(API_URL + '/canciones', { 
          method: 'POST', headers: getAuthHeaders('POST'), 
          body: JSON.stringify({ titulo, artista, duracion, album, url }) 
      });
      setTitulo(''); setArtista(''); setDuracion(''); setAlbum(''); setUrl(''); 
      fetchCanciones(); 
    } catch (error) { alert('Error al guardar.'); }
  };
  const handleDelete = async (id) => {
    if (!isAdmin) return; if (!window.confirm("¿Eliminar?")) return;
    try {
      const res = await fetch(`${API_URL}/canciones/${id}`, { method: 'DELETE', headers: getAuthHeaders('DELETE') });
      if (res.status === 204) fetchCanciones(); else if (res.status === 403) alert("Sin permisos.");
    } catch (error) { console.error('Error:', error); }
  };

  const createPlaylist = () => {
      const name = prompt("Nombre playlist:");
      if (name) setAllPlaylists([...allPlaylists, { id: Date.now(), name, songs: [], owner: user.username, isPublic: false }]);
  };
  const togglePlaylistPrivacy = (id) => {
      setAllPlaylists(allPlaylists.map(p => (p.id === id && p.owner === user.username) ? { ...p, isPublic: !p.isPublic } : p));
  };
  const deletePlaylist = (id) => {
      if(window.confirm("¿Borrar?")) setAllPlaylists(allPlaylists.filter(p => p.id !== id));
  };
  const openAddToPlaylistModal = (song) => { setSongToAdd(song); setShowAddToPlaylistModal(true); };
  const addSongToPlaylist = (id) => {
      setAllPlaylists(allPlaylists.map(p => p.id === id ? { ...p, songs: p.songs.find(s => s.id === songToAdd.id) ? p.songs : [...p.songs, songToAdd] } : p));
      setShowAddToPlaylistModal(false); setSongToAdd(null);
  };
  const removeSongFromPlaylist = (pid, sid) => {
      setAllPlaylists(allPlaylists.map(p => p.id === pid ? { ...p, songs: p.songs.filter(s => s.id !== sid) } : p));
  };

  const handleSearchLyrics = async (artist, title) => {
    setLoadingLyrics(true); setShowLyricsModal(true); setCurrentSongTitle(`${title} - ${artist}`); setLyrics('Buscando letra...');
    try {
        const res = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`);
        const data = await res.json(); setLyrics(data.lyrics || 'No encontrada.');
    } catch (error) { setLyrics('Error de conexión.'); } finally { setLoadingLyrics(false); }
  };

  const filteredSongs = canciones.filter(c => c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || c.artista.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- COMPONENTE ITEM ---
  const CancionItem = ({ cancion, index, isPlaylistView = false, playlistId = null, playlistOwner = null }) => { 
    if (cancion.id === editingId) return <EditForm cancion={cancion} API_URL={API_URL} authHeaders={getAuthHeaders('PUT')} onSave={() => { setEditingId(null); fetchCanciones(); }} onCancel={() => setEditingId(null)} />;

    const youtubeLink = `https://www.youtube.com/results?search_query=${cancion.artista}+${cancion.titulo}`;
    const spotifyLink = `https://open.spotify.com/search/${cancion.artista} ${cancion.titulo}`;
    
    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return `hsl(${hash % 360}, 70%, 40%)`; 
    };
    const coverColor = stringToColor(cancion.titulo + cancion.artista);
    const isPlayingThis = currentSong?.id === cancion.id;
    const isMyPlaylist = isPlaylistView && playlistOwner === user.username;

    // Spinner simple si se está cargando ESTA canción
    const isLoadingThis = isSearchingAudio && isPlayingThis;

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
                {!isPlayingThis && (
                    <div className="d-flex align-items-center justify-content-center h-100 w-100">
                        <i className="bi bi-music-note text-white-50"></i>
                    </div>
                )}
            </div>

            <div style={{overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>
                <h6 className={`mb-0 fw-bold ${isPlayingThis ? 'text-success' : 'text-white'}`}>{cancion.titulo}</h6>
                <small className="text-white-50">{cancion.artista}</small>
            </div>
        </div>

        <div className="d-flex align-items-center gap-2 opacity-75">
            <button className="btn btn-sm btn-link text-secondary hover-white" onClick={() => handleSearchLyrics(cancion.artista, cancion.titulo)} title="Letra"><i className="bi bi-mic"></i></button>
            <a href={youtubeLink} target="_blank" rel="noreferrer" className="btn btn-link text-danger p-1 hover-white" title="YouTube"><i className="bi bi-youtube"></i></a>
            <a href={spotifyLink} target="_blank" rel="noreferrer" className="btn btn-link text-success p-1 hover-white" title="Spotify"><i className="bi bi-spotify"></i></a>
            {!isPlaylistView && <button className="btn btn-link text-secondary hover-white" onClick={() => openAddToPlaylistModal(cancion)} title="Agregar a Playlist"><i className="bi bi-plus-circle"></i></button>}
            {isMyPlaylist && <button className="btn btn-link text-secondary hover-danger" onClick={() => removeSongFromPlaylist(playlistId, cancion.id)} title="Quitar de Playlist"><i className="bi bi-x-circle"></i></button>}
            {!isPlaylistView && isLoggedIn && isAdmin && (
                <>
                    <button className="btn btn-link text-secondary hover-info" onClick={() => setEditingId(cancion.id)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-link text-secondary hover-danger" onClick={() => handleDelete(cancion.id)}><i className="bi bi-trash"></i></button>
                </>
            )}
            <div className="text-muted ms-3 small d-none d-md-block" style={{minWidth: '40px'}}>{cancion.duracion}</div>
        </div>
      </div>
    );
  };

  // --- MODALES (Igual que antes) ---
  const LyricsModal = () => !showLyricsModal ? null : (
    <div className="modal d-block fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content bg-dark text-white border-0 shadow-lg">
          <div className="modal-header border-bottom border-secondary">
            <h5 className="modal-title text-success"><i className="bi bi-mic-fill me-2"></i> {currentSongTitle}</h5>
            <button className="btn-close btn-close-white" onClick={() => setShowLyricsModal(false)}></button>
          </div>
          <div className="modal-body text-center p-4">
             {loadingLyrics ? <div className="spinner-border text-success"></div> : <p className="fs-5 lh-lg" style={{whiteSpace: 'pre-line'}}>{lyrics}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const AddToPlaylistModal = () => !showAddToPlaylistModal ? null : (
    <div className="modal d-block fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content card-glass border-secondary shadow-lg">
          <div className="modal-header border-secondary">
            <h5 className="modal-title text-white">Agregar a Playlist</h5>
            <button className="btn-close btn-close-white" onClick={() => setShowAddToPlaylistModal(false)}></button>
          </div>
          <div className="modal-body p-0">
              <div className="p-3">
                <p className="text-muted mb-2">Elige una playlist para <strong>{songToAdd?.titulo}</strong>:</p>
                {userPlaylists.length > 0 ? (
                    <div className="list-group list-group-flush">
                        {userPlaylists.map(p => (
                            <button key={p.id} className="list-group-item list-group-item-action bg-transparent text-white border-secondary d-flex justify-content-between align-items-center py-3" onClick={() => addSongToPlaylist(p.id)}>
                                <span className="fw-bold"><i className="bi bi-music-note-list me-2 text-success"></i> {p.name}</span>
                                <span className="badge bg-secondary rounded-pill">{p.songs.length}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <button className="btn btn-spotify" onClick={() => {setShowAddToPlaylistModal(false); createPlaylist();}}>Crear Nueva Playlist</button>
                    </div>
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isLoggedIn) return <div className="container-fluid p-0"><LoginAuth onAuthSubmit={handleAuth} /></div>;

  return (
    <div className="container-fluid p-0 position-relative pb-5"> 
      <LyricsModal /> 
      <AddToPlaylistModal />
      
      <BottomPlayer currentSong={currentSong} isPlaying={isPlaying} onTogglePlay={togglePlay} />

      <nav className="navbar navbar-dark sticky-top px-4 py-3 shadow-sm" style={{ backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 9999, borderBottom: '1px solid #333' }}>
          <div className="d-flex align-items-center">
             <i className="bi bi-spotify text-success fs-3 me-2"></i>
             <span className="fw-bold fs-4 text-white ms-2">Música Local</span>
          </div>
          <div className="d-none d-md-flex gap-2 bg-dark p-1 rounded-pill border border-secondary">
              <button className={`btn btn-sm rounded-pill px-3 ${view === 'library' ? 'btn-secondary text-white' : 'text-muted'}`} onClick={() => setView('library')}>Explorar</button>
              <button className={`btn btn-sm rounded-pill px-3 ${view === 'playlists' ? 'btn-secondary text-white' : 'text-muted'}`} onClick={() => setView('playlists')}>Mis Playlists</button>
          </div>
          <div className="d-flex align-items-center gap-3">
              <div className="text-end d-none d-sm-block lh-1">
                  <span className="d-block fw-bold text-white small">{user.username}</span>
                  <span className="badge bg-success" style={{ fontSize: '0.6rem' }}>{user.role}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline-light btn-sm rounded-pill px-3"><i className="bi bi-box-arrow-right"></i></button>
          </div>
      </nav>

      <div className="container mt-4" style={{paddingBottom: '120px'}}> 
        <div className="p-5 mb-4 rounded-3 d-flex align-items-end" style={{ background: 'linear-gradient(to bottom right, #404040, #121212)', minHeight: '200px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div className="me-4 shadow-lg d-none d-md-block" style={{width: '180px', height: '180px', background: 'linear-gradient(135deg, #1db954, #105c28)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <i className="bi bi-heart-fill text-white display-1" style={{opacity: 0.8}}></i>
            </div>
            <div>
                <span className="text-uppercase small fw-bold text-white">Lista de Reproducción</span>
                <h1 className="display-3 fw-bold text-white mb-2">{view === 'library' ? 'Biblioteca Global' : 'Mis Colecciones'}</h1>
                <p className="text-white-50 mb-4">{view === 'library' ? `Explora las ${canciones.length} canciones disponibles.` : `Tienes ${userPlaylists.length} playlists creadas.`}</p>
                
                <div className="d-flex gap-2">
                    {view === 'playlists' && <button className="btn btn-spotify rounded-pill fw-bold" onClick={createPlaylist}><i className="bi bi-plus-lg me-2"></i>Nueva Playlist</button>}
                    {view === 'library' && isAdmin && <button className="btn btn-outline-light rounded-pill fw-bold" onClick={() => document.getElementById('form-add').scrollIntoView({ behavior: 'smooth' })}>Añadir Canción</button>}
                </div>
            </div>
        </div>

        {view === 'library' && (
            <div className="mb-4 position-relative">
                <i className="bi bi-search position-absolute text-muted" style={{top: '12px', left: '15px'}}></i>
                <input type="text" className="form-control bg-dark border-0 text-white ps-5 py-2 rounded-pill" placeholder="Buscar artistas, canciones o álbumes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
        )}

        {view === 'library' && (
            <div className="bg-transparent">
                <div className="d-flex text-muted small px-3 mb-2 text-uppercase fw-bold border-bottom border-secondary pb-2">
                    <span style={{ width: '40px' }}>#</span>
                    <span className="flex-grow-1">Título</span>
                    <span className="d-none d-md-block" style={{ width: '150px' }}><i className="bi bi-clock"></i></span>
                </div>
                {filteredSongs.map((c, index) => <CancionItem key={c.id} cancion={c} index={index} />)}
                {isAdmin && (
                    <div id="form-add" className="card card-glass text-white mt-5">
                        <div className="card-body">
                            <h5 className="mb-3 text-success">Agregar Nueva Canción</h5>
                            <form onSubmit={handleSubmit} className="row g-2">
                                <div className="col-md-4"><input className="form-control" placeholder="Título" value={titulo} onChange={e=>setTitulo(e.target.value)} required /></div>
                                <div className="col-md-3"><input className="form-control" placeholder="Artista" value={artista} onChange={e=>setArtista(e.target.value)} required /></div>
                                <div className="col-md-3"><input className="form-control" placeholder="Álbum" value={album} onChange={e=>setAlbum(e.target.value)} /></div>
                                {/* Input nuevo de URL */}
                                <div className="col-md-12 my-2"><input className="form-control form-control-sm" placeholder="URL Audio (mp3) - Opcional" value={url} onChange={e=>setUrl(e.target.value)} /></div>
                                <div className="col-md-2"><button type="submit" className="btn btn-spotify w-100">Guardar</button></div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )}

        {view === 'playlists' && (
            <div className="row g-4">
                {userPlaylists.map(playlist => (
                    <div key={playlist.id} className="col-md-6 col-lg-4">
                        <div className="card bg-dark border-0 shadow-sm h-100 hover-bg transition-up">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="bg-secondary rounded shadow d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                                        <i className="bi bi-music-note-list text-white fs-2"></i>
                                    </div>
                                    <button className="btn btn-link text-secondary hover-danger p-0" onClick={() => deletePlaylist(playlist.id)}><i className="bi bi-x-lg"></i></button>
                                </div>
                                <h4 className="card-title text-white fw-bold mb-1">{playlist.name}</h4>
                                <p className="text-white-50 small mb-3">Por {playlist.owner} • {playlist.songs.length} canciones</p>
                                <button className="btn btn-sm btn-link text-success p-0 mb-3 text-decoration-none" onClick={() => togglePlaylistPrivacy(playlist.id)}>
                                    <i className={`bi ${playlist.isPublic ? 'bi-globe' : 'bi-lock-fill'} me-1`}></i>
                                    {playlist.isPublic ? 'Pública' : 'Privada'}
                                </button>
                                
                                <div className="border-top border-secondary pt-3">
                                    {playlist.songs.length > 0 ? (
                                        <div className="d-flex flex-column gap-2">
                                            {playlist.songs.slice(0, 3).map((s, i) => (
                                                <div key={i} className="text-white-50 small text-truncate"><i className="bi bi-music-note me-2"></i>{s.titulo}</div>
                                            ))}
                                            {playlist.songs.length > 3 && <div className="text-muted small ms-3">...y {playlist.songs.length - 3} más</div>}
                                        </div>
                                    ) : <div className="text-muted small fst-italic">Vacía</div>}
                                </div>
                            </div>
                            <div className="card-footer bg-transparent border-0 pb-3">
                                <button className="btn btn-spotify w-100 rounded-pill" onClick={() => alert("Abrir playlist completa próximamente")}>Ver Playlist</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}

export default App;