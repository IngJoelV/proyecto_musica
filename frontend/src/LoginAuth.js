import React, { useState } from 'react';

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
            {/* Tarjeta con efecto Glass y sombra suave */}
            <div className="card card-glass shadow-lg p-4 fade-in" style={{ width: '100%', maxWidth: '420px', borderRadius: '20px' }}>
                <div className="card-body p-4">
                    
                    <div className="text-center mb-5">
                        {/* Icono de Música Grande */}
                        <i className="bi bi-music-note-beamed text-success" style={{ fontSize: '3rem' }}></i>
                        <h2 className="fw-bold mt-2">Música Local</h2>
                    </div>

                    <h5 className="text-center mb-4 text-white-50">
                        {isLoginView ? 'Continua con tu música' : 'Únete a la colección'}
                    </h5>

                    <form onSubmit={handleSubmit}>
                        {/* Floating Label: Usuario */}
                        <div className="form-floating mb-3">
                            <input
                                type="text"
                                className="form-control"
                                id="floatingInput"
                                placeholder="Usuario"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <label htmlFor="floatingInput">Nombre de usuario</label>
                        </div>

                        {/* Floating Label: Contraseña */}
                        <div className="form-floating mb-4">
                            <input
                                type="password"
                                className="form-control"
                                id="floatingPassword"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <label htmlFor="floatingPassword">Contraseña</label>
                        </div>

                        <div className="d-grid gap-2">
                            <button type="submit" className="btn btn-spotify">
                                {isLoginView ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-5 pt-3 border-top border-secondary">
                        <p className="mb-2 text-muted small">
                            {isLoginView ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                        </p>
                        <button 
                            className="link-spotify text-uppercase small"
                            onClick={() => setIsLoginView(!isLoginView)}
                        >
                            {isLoginView ? 'Regístrate aquí' : 'Inicia sesión'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default LoginAuth;