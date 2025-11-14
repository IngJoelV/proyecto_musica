import React from 'react';
import ReactDOM from 'react-dom/client'; // Importa la API moderna de React 18+
import './index.css'; // Si tienes estilos CSS globales
import App from './App'; // Importa tu componente App.js

// Usamos el método de renderizado de React 18
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Nota: Si tu proyecto es más antiguo (React < 18), podrías ver:
/*
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
*/