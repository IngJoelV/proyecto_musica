// src/EditForm.js

import React, { useState } from 'react';

// Este componente solo maneja la edición de UNA canción
const EditForm = ({ cancion, API_URL, onSave, onCancel }) => {
    // Los estados de edición son LOCALES a este componente
    const [editTitle, setEditTitle] = useState(cancion.titulo);
    const [editArtista, setEditArtista] = useState(cancion.artista);
    const [editDuracion, setEditDuracion] = useState(cancion.duracion);

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editTitle.trim() || !editArtista.trim()) return;

        try {
            const response = await fetch(`${API_URL}/canciones/${cancion.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    titulo: editTitle,
                    artista: editArtista,
                    duracion: editDuracion,
                }),
            });

            if (response.ok) {
                onSave(); // Llama a la función de App.js para recargar la lista
            } else {
                throw new Error('Fallo la actualización');
            }
        } catch (error) {
            console.error('Error al actualizar la canción:', error);
            alert('Ocurrió un error al actualizar la canción.');
        }
    };

    return (
        <li className="list-group-item">
          <form onSubmit={handleUpdate} className="row g-2 align-items-center">
            <div className="col-4">
              <input type="text" className="form-control form-control-sm" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            <div className="col-4">
              <input type="text" className="form-control form-control-sm" value={editArtista} onChange={(e) => setEditArtista(e.target.value)} required />
            </div>
            <div className="col-2">
              <input type="text" className="form-control form-control-sm" value={editDuracion} onChange={(e) => setEditDuracion(e.target.value)} />
            </div>
            <div className="col-2 btn-group">
              <button type="submit" className="btn btn-success btn-sm">Guardar</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
            </div>
          </form>
        </li>
    );
};

export default EditForm;