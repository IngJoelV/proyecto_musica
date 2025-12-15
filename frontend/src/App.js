import React, { useEffect, useState } from 'react';

// ==========================================
// COMPONENTE 1: LOGIN / REGISTRO (LoginAuth)
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
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="card card-glass shadow-lg p-4 fade-in" style={{ width: '100%', maxWidth: '420px', borderRadius: '20px' }}>
                <div className="card-body p-4">
                    <div className="text-center mb-5">
                        <i className="bi bi-music-note-beamed text-success" style={{ fontSize: '3rem' }}></i>
                        <h2 className="fw-bold mt-2">Música Local</h2>
                    </div>
                    <h5 className="text-center mb-4 text-white-50">
                        {isLoginView ? 'Continua con tu música' : 'Únete a la colección'}
                    </h5>
                    <form onSubmit={handleSubmit}>
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
                    <div className="text-center mt-5 pt-3 border-top border-secondary">
                        <button className="link-spotify text-uppercase small" onClick={() => setIsLoginView(!isLoginView)}>
                            {isLoginView ? 'Regístrate aquí' : 'Inicia sesión'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// COMPONENTE 2: FORMULARIO DE EDICIÓN
// ==========================================
function EditForm({ cancion, API_URL, authHeaders, onSave, onCancel }) {
    const [editTitle, setEditTitle] = useState(cancion.titulo);
    const [editArtista, setEditArtista] = useState(cancion.artista);
    const [editDuracion, setEditDuracion] = useState(cancion.duracion);
    // Agregamos estado para álbum (preparado para futuro backend)
    const [editAlbum, setEditAlbum] = useState(cancion.album || ''); 

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/canciones/${cancion.id}`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({
                    titulo: editTitle,
                    artista: editArtista,
                    duracion: editDuracion,
                    album: editAlbum // Se envía, el backend lo ignorará si no está configurado
                }),
            });
            if (response.ok) onSave();
            else alert('Error al actualizar.');
        } catch (error) { console.error('Error:', error); }
    };

    return (
        <div className="song-row p-2 bg-dark border border-success rounded mb-2">
            <form onSubmit={handleUpdate} className="d-flex align-items-center gap-2 flex-wrap">
                <input type="text" className="form-control form-control-sm bg-secondary text-white border-0" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Título" required style={{flex: 2}} />
                <input type="text" className="form-control form-control-sm bg-secondary text-white border-0" value={editArtista} onChange={(e) => setEditArtista(e.target.value)} placeholder="Artista" required style={{flex: 2}} />
                <input type="text" className="form-control form-control-sm bg-secondary text-white border-0" value={editAlbum} onChange={(e) => setEditAlbum(e.target.value)} placeholder="Álbum" style={{flex: 2}} />
                <input type="text" className="form-control form-control-sm bg-secondary text-white border-0" value={editDuracion} onChange={(e) => setEditDuracion(e.target.value)} placeholder="Dur." style={{flex: 1}} />
                <button type="submit" className="btn btn-success btn-sm"><i className="bi bi-check-lg"></i></button>
                <button type="button" className="btn btn-outline-light btn-sm" onClick={onCancel}><i className="bi bi-x-lg"></i></button>
            </form>
        </div>
    );
}

// ==========================================
// COMPONENTE PRINCIPAL (App)
// ==========================================
function App() {
  const [canciones, setCanciones] = useState([]);
  
  // Estados de formulario de Admin
  const [titulo, setTitulo] = useState('');
  const [artista, setArtista] = useState('');
  const [duracion, setDuracion] = useState('');
  const [album, setAlbum] = useState(''); // Nuevo campo Álbum

  const [editingId, setEditingId] = useState(null); 
  
  // Estados de UI y Funcionalidad Usuario
  const [lyrics, setLyrics] = useState(''); 
  const [showModal, setShowModal] = useState(false); 
  const [loadingLyrics, setLoadingLyrics] = useState(false); 
  const [currentSongTitle, setCurrentSongTitle] = useState(''); 
  const [searchTerm, setSearchTerm] = useState(''); // Buscador
  const [view, setView] = useState('library'); // 'library' o 'playlists'
  
  // Sistema de Playlists (Local)
  const [playlists, setPlaylists] = useState(() => {
      const saved = localStorage.getItem('my_playlists');
      return saved ? JSON.parse(saved) : [];
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { token: null, role: 'guest', username: null };
  });

  const isAdmin = user.role === 'admin';
  const isLoggedIn = !!user.token;
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'; 
  const AUTH_URL = API_URL; 

  // Persistencia
  useEffect(() => { localStorage.setItem('user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('my_playlists', JSON.stringify(playlists)); }, [playlists]);

  const getAuthHeaders = (method = 'GET') => {
    const headers = { 'Content-Type': 'application/json' };
    if (user.token) headers['Authorization'] = `Bearer ${user.token}`;
    return headers;
  };

  // --- LÓGICA DE AUTENTICACIÓN ---
  const handleAuth = async (isLogin, credentials) => {
    const endpoint = isLogin ? 'login' : 'register';
    try {
        const response = await fetch(`${AUTH_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error de red.');
        
        if (isLogin) {
            setUser({ token: data.token, role: data.role, username: data.username });
        } else {
            alert('Registro exitoso. ¡Ahora inicia sesión!');
        }
    } catch (error) { alert(`Error: ${error.message}`); }
  };

  const handleLogout = () => {
    localStorage.removeItem('user'); 
    setUser({ token: null, role: 'guest', username: null }); 
  };

  // --- LÓGICA DE DATOS ---
  const fetchCanciones = () => {
    fetch(API_URL + '/canciones')
      .then((res) => res.json())
      .then((data) => setCanciones(data))
      .catch((error) => console.error('Error:', error));
  };

  useEffect(() => { fetchCanciones(); }, [API_URL, user.token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert("Acceso denegado.");
    try {
      await fetch(API_URL + '/canciones', {
        method: 'POST',
        headers: getAuthHeaders('POST'),
        body: JSON.stringify({ titulo, artista, duracion, album }), // Enviamos álbum
      });
      setTitulo(''); setArtista(''); setDuracion(''); setAlbum('');
      fetchCanciones(); 
    } catch (error) { alert('Error al guardar.'); }
  };
  
  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm("¿Eliminar canción?")) return;
    try {
      const res = await fetch(`${API_URL}/canciones/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders('DELETE'),
      });
      if (res.status === 204) fetchCanciones();
      else if (res.status === 403) alert("Sin permisos.");
    } catch (error) { console.error('Error:', error); }
  };

  // --- GESTIÓN DE PLAYLISTS ---
  const createPlaylist = () => {
      const name = prompt("Nombre de la nueva playlist:");
      if (name) {
          setPlaylists([...playlists, { id: Date.now(), name, songs: [] }]);
      }
  };

  const addToPlaylist = (playlistId, song) => {
      const updatedPlaylists = playlists.map(p => {
          if (p.id === playlistId) {
              // Evitar duplicados
              if (p.songs.find(s => s.id === song.id)) return p;
              return { ...p, songs: [...p.songs, song] };
          }
          return p;
      });
      setPlaylists(updatedPlaylists);
      alert(`Añadida a la playlist!`);
  };

  const removeFromPlaylist = (playlistId, songId) => {
      const updatedPlaylists = playlists.map(p => {
          if (p.id === playlistId) {
              return { ...p, songs: p.songs.filter(s => s.id !== songId) };
          }
          return p;
      });
      setPlaylists(updatedPlaylists);
  };

  // --- LÓGICA DE LETRAS ---
  const handleSearchLyrics = async (artist, title) => {
    setLoadingLyrics(true); setShowModal(true); setCurrentSongTitle(`${title} - ${artist}`);
    setLyrics('Buscando letra...');
    try {
        const response = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`);
        const data = await response.json();
        setLyrics(data.lyrics || 'Letra no encontrada.');
    } catch (error) { setLyrics('Error de conexión.'); }
    finally { setLoadingLyrics(false); }
  };

  // --- FILTRADO DE BÚSQUEDA ---
  const filteredSongs = canciones.filter(c => 
      c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.artista.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.album && c.album.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- RENDERIZADO DE ITEM ---
  const CancionItem = ({ cancion, index, isPlaylistView = false, playlistId = null }) => { 
    if (cancion.id === editingId) {
        return <EditForm cancion={cancion} API_URL={API_URL} authHeaders={getAuthHeaders('PUT')} onSave={() => { setEditingId(null); fetchCanciones(); }} onCancel={() => setEditingId(null)} />;
    }

    const youtubeLink = `https://www.youtube.com/results?search_query=${cancion.artista}+${cancion.titulo}`;
    const spotifyLink = `https://open.spotify.com/search/${cancion.artista} ${cancion.titulo}`;

    return (
      <div className="song-row d-flex align-items-center justify-content-between mb-2 p-2 hover-bg text-white border-bottom border-secondary">
        <div className="d-flex align-items-center flex-grow-1" style={{minWidth: '200px'}}>
            <span className="text-muted me-3" style={{ width: '20px' }}>{index + 1}</span>
            <div className="bg-secondary d-flex justify-content-center align-items-center rounded me-3" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-music-note-beamed text-white"></i>
            </div>
            <div>
                <h6 className="mb-0 fw-bold">{cancion.titulo}</h6>
                <small className="text-muted">{cancion.artista} {cancion.album && `• ${cancion.album}`}</small>
            </div>
        </div>

        <div className="d-flex align-items-center gap-2">
            {/* Acciones de Usuario Normal */}
            <button className="btn btn-sm btn-outline-light rounded-pill" onClick={() => handleSearchLyrics(cancion.artista, cancion.titulo)} title="Ver Letra"><i className="bi bi-mic"></i></button>
            <a href={youtubeLink} target="_blank" rel="noreferrer" className="btn btn-link text-danger p-1"><i className="bi bi-youtube fs-5"></i></a>
            <a href={spotifyLink} target="_blank" rel="noreferrer" className="btn btn-link text-success p-1"><i className="bi bi-spotify fs-5"></i></a>
            
            {/* Dropdown Agregar a Playlist (Solo en biblioteca global) */}
            {!isPlaylistView && playlists.length > 0 && (
                <div className="dropdown">
                    <button className="btn btn-link text-white-50 p-1" data-bs-toggle="dropdown"><i className="bi bi-plus-circle"></i></button>
                    <ul className="dropdown-menu dropdown-menu-dark">
                        <li><h6 className="dropdown-header">Agregar a...</h6></li>
                        {playlists.map(p => (
                            <li key={p.id}><button className="dropdown-item" onClick={() => addToPlaylist(p.id, cancion)}>{p.name}</button></li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Eliminar de Playlist */}
            {isPlaylistView && (
                <button className="btn btn-link text-danger p-1" onClick={() => removeFromPlaylist(playlistId, cancion.id)} title="Quitar de playlist"><i className="bi bi-x-circle"></i></button>
            )}

            {/* Acciones de Admin (Solo en biblioteca global) */}
            {!isPlaylistView && isLoggedIn && isAdmin && (
                <>
                    <button className="btn btn-link text-info p-1" onClick={() => setEditingId(cancion.id)}><i className="bi bi-pencil-square"></i></button>
                    <button className="btn btn-link text-danger p-1" onClick={() => handleDelete(cancion.id)}><i className="bi bi-trash"></i></button>
                </>
            )}
        </div>
      </div>
    );
  };

  // --- MODAL LETRAS ---
  const LyricsModal = () => {
      if (!showModal) return null;
      return (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content bg-dark text-white border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title text-success"><i className="bi bi-mic-fill me-2"></i> {currentSongTitle}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body text-center" style={{ whiteSpace: 'pre-line' }}>
                 {loadingLyrics ? <div className="spinner-border text-success"></div> : <p className="fs-6 lh-lg">{lyrics}</p>}
              </div>
            </div>
          </div>
        </div>
      );
  };

  // --- RENDERIZADO PRINCIPAL ---
  if (!isLoggedIn) return <div className="container-fluid p-0"><LoginAuth onAuthSubmit={handleAuth} /></div>;

  return (
    <div className="container-fluid p-0 position-relative"> 
      <LyricsModal /> 

      <nav className="navbar navbar-dark sticky-top px-4 py-3 shadow-sm" style={{ backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 9999, borderBottom: '1px solid #333' }}>
          <div className="d-flex align-items-center">
             <i className="bi bi-spotify text-success fs-3 me-2"></i>
             <span className="fw-bold fs-4 text-white">Música Local</span>
          </div>
          {/* Navegación Central (Tabs) */}
          <div className="d-none d-md-flex gap-3">
              <button className={`btn btn-sm ${view === 'library' ? 'btn-light' : 'btn-outline-secondary'}`} onClick={() => setView('library')}>Explorar</button>
              <button className={`btn btn-sm ${view === 'playlists' ? 'btn-light' : 'btn-outline-secondary'}`} onClick={() => setView('playlists')}>Mis Playlists</button>
          </div>
          <div className="d-flex align-items-center gap-3">
              <div className="text-end d-none d-sm-block lh-1">
                  <span className="d-block fw-bold text-white small">{user.username}</span>
                  <span className="badge bg-success" style={{ fontSize: '0.6rem' }}>{user.role}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold"><i className="bi bi-box-arrow-right me-1"></i> Salir</button>
          </div>
      </nav>

      <div className="container mt-4 pb-5"> 
        {/* Banner o Buscador */}
        <div className="p-4 mb-4 rounded-3" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
            <div className="d-flex justify-content-between align-items-end">
                <div>
                    <h2 className="fw-bold text-white mb-2">{view === 'library' ? 'Explorar Biblioteca' : 'Mis Playlists'}</h2>
                    <p className="text-white-50 mb-0">{view === 'library' ? 'Descubre nueva música agregada por los administradores.' : 'Crea tus propias mezclas.'}</p>
                </div>
                {view === 'playlists' && <button className="btn btn-light rounded-pill fw-bold" onClick={createPlaylist}><i className="bi bi-plus-lg"></i> Nueva Playlist</button>}
                {view === 'library' && isAdmin && <button className="btn btn-spotify rounded-pill fw-bold" onClick={() => document.getElementById('form-add').scrollIntoView({ behavior: 'smooth' })}><i className="bi bi-plus-circle"></i> Añadir Canción</button>}
            </div>
            
            {/* Barra de Búsqueda (Solo en Library) */}
            {view === 'library' && (
                <div className="mt-4">
                    <div className="input-group">
                        <span className="input-group-text bg-dark border-0 text-white"><i className="bi bi-search"></i></span>
                        <input type="text" className="form-control bg-dark border-0 text-white" placeholder="Buscar por título, artista o álbum..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            )}
        </div>

        {/* VISTA 1: BIBLIOTECA GLOBAL */}
        {view === 'library' && (
            <>
                <div className="mb-5 bg-dark rounded p-3 border border-secondary">
                    <div className="d-flex text-muted small px-2 mb-2 text-uppercase">
                        <span style={{ width: '30px' }}>#</span>
                        <span className="flex-grow-1">Título</span>
                        <span className="d-none d-md-block" style={{ width: '180px' }}>Acciones</span>
                    </div>
                    <hr className="border-secondary mt-0" />
                    {filteredSongs.length > 0 ? (
                        filteredSongs.map((c, index) => <CancionItem key={c.id} cancion={c} index={index} />)
                    ) : (
                        <p className="text-muted text-center py-4">No se encontraron canciones.</p>
                    )}
                </div>

                {isAdmin && (
                    <div id="form-add" className="card card-glass text-white mt-5 mb-5">
                        <div className="card-body">
                            <h5 className="mb-4"><i className="bi bi-disc me-2"></i>Añadir Nueva Canción</h5>
                            <form onSubmit={handleSubmit}>
                                <div className="row g-3">
                                    <div className="col-md-4"><input type="text" className="form-control" placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required /></div>
                                    <div className="col-md-3"><input type="text" className="form-control" placeholder="Artista" value={artista} onChange={(e) => setArtista(e.target.value)} required /></div>
                                    <div className="col-md-3"><input type="text" className="form-control" placeholder="Álbum (Opcional)" value={album} onChange={(e) => setAlbum(e.target.value)} /></div>
                                    <div className="col-md-2">
                                        <div className="input-group"><input type="text" className="form-control" placeholder="Dur." value={duracion} onChange={(e) => setDuracion(e.target.value)} /><button type="submit" className="btn btn-success"><i className="bi bi-check-lg"></i></button></div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </>
        )}

        {/* VISTA 2: PLAYLISTS */}
        {view === 'playlists' && (
            <div className="row">
                {playlists.length > 0 ? (
                    playlists.map(playlist => (
                        <div key={playlist.id} className="col-12 mb-4">
                            <div className="card bg-dark border-secondary">
                                <div className="card-header border-secondary d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 text-white"><i className="bi bi-music-note-list me-2 text-success"></i> {playlist.name}</h5>
                                    <small className="text-muted">{playlist.songs.length} canciones</small>
                                </div>
                                <div className="card-body p-0">
                                    {playlist.songs.length > 0 ? (
                                        playlist.songs.map((s, idx) => (
                                            <div className="border-bottom border-secondary px-3" key={idx}>
                                                <CancionItem cancion={s} index={idx} isPlaylistView={true} playlistId={playlist.id} />
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted text-center py-3 m-0 small">Playlist vacía. Ve a "Explorar" para agregar música.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-5">
                        <i className="bi bi-music-note-list display-1 text-secondary mb-3"></i>
                        <h3 className="text-white">No tienes playlists aún</h3>
                        <p className="text-muted">Crea una nueva y empieza a coleccionar tu música.</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}

export default App;



//set NODE_OPTIONS=-openssl-legacy-provider && npm start