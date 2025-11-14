// src/App.js

import React, { useEffect, useState } from 'react';
import EditForm from './EditForm'; // <-- ¡IMPORTA EL NUEVO COMPONENTE!

function App() {
  const [canciones, setCanciones] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [artista, setArtista] = useState('');
  const [duracion, setDuracion] = useState('');

  // SOLO necesitamos el ID de la canción que se está editando
  const [editingId, setEditingId] = useState(null); 

  const API_URL = process.env.REACT_APP_API_URL; 

  const fetchCanciones = () => {
    fetch(API_URL + '/canciones')
      .then((res) => res.json())
      .then((data) => setCanciones(data))
      .catch((error) => console.error('Error al obtener canciones:', error));
  };

  useEffect(() => {
    fetchCanciones();
  }, [API_URL]);

  // Manejador para crear una nueva canción (sin cambios)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !artista.trim()) {
        alert("El título y el artista son obligatorios.");
        return;
    }
    
    try {
        await fetch(API_URL + '/canciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, artista, duracion }),
        });
        
        setTitulo('');
        setArtista('');
        setDuracion('');
        fetchCanciones(); 
    } catch (error) {
        console.error('Error al agregar la canción:', error);
        alert('Ocurrió un error al guardar la canción.');
    }
  };
  
  // Manejador para eliminar una canción (sin cambios)
  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta canción?")) return;
    
    try {
        const response = await fetch(`${API_URL}/canciones/${id}`, { method: 'DELETE' });

        if (response.status === 204) {
            fetchCanciones(); 
        } else {
            console.error('Error al intentar eliminar:', response.status);
        }
    } catch (error) {
        console.error('Error de red al eliminar la canción:', error);
    }
  };

  // --- COMPONENTE AUXILIAR RENOMBRADO Y SIMPLIFICADO ---
  const CancionItem = ({ cancion }) => {
    // Lógica para mostrar el formulario de edición (AHORA USAMOS EditForm)
    if (cancion.id === editingId) {
        return (
            <EditForm 
                cancion={cancion} 
                API_URL={API_URL} 
                onSave={() => { setEditingId(null); fetchCanciones(); }} // Al guardar, sal del modo edición y recarga
                onCancel={() => setEditingId(null)} // Al cancelar, sal del modo edición
            />
        );
    }

    // Si no se está editando, muestra la vista normal (sin cambios)
    return (
      <li className="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <p className="mb-0 fw-bold">{cancion.titulo}</p>
          <small className="text-muted">Artista: {cancion.artista} | Duración: {cancion.duracion}</small>
        </div>
        
        <div className="btn-group btn-group-sm">
            <button 
                className="btn btn-info text-white" 
                onClick={() => setEditingId(cancion.id)} // Inicia la edición
            >
                Editar
            </button>
            <button 
                className="btn btn-danger"
                onClick={() => handleDelete(cancion.id)}
            >
                Eliminar
            </button>
            <button 
                className="btn btn-primary" 
                onClick={() => alert(`Detalles de ${cancion.titulo}:\nArtista: ${cancion.artista}\nDuración: ${cancion.duracion}`)}
            >
                Detalles
            </button>
        </div>
      </li>
    );
  };


  return (
    <div className="container mt-5"> 
      <h1 className="text-center mb-4 text-danger">💿 Mi Colección de Música</h1>

      {/* Formulario de Adición (CREATE) */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">Añadir Nueva Canción</h5>
          
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <input type="text" className="form-control" placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <input type="text" className="form-control" placeholder="Artista" value={artista} onChange={(e) => setArtista(e.target.value)} required />
              </div>
              <div className="col-md-2">
                <input type="text" className="form-control" placeholder="Duración (ej. 3:45)" value={duracion} onChange={(e) => setDuracion(e.target.value)} />
              </div>
              <div className="col-md-2 d-grid">
                <button type="submit" className="btn btn-success">Guardar 🎵</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Lista de Canciones (READ) */}
      <h3 className="mt-5 mb-3">Lista de Canciones ({canciones.length})</h3>
      <ul className="list-group">
        {canciones.map((c) => (
          <CancionItem key={c.id} cancion={c} /> 
        ))}
      </ul>
    </div>
  );
}

export default App;