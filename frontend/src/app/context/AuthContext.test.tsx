import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

function AuthProbe() {
  const { usuario, isLoading, login, logout, hasRole } = useAuth();
  const [message, setMessage] = useState('');

  return (
    <div>
      <span>{isLoading ? 'cargando' : usuario?.rol ?? 'sin sesión'}</span>
      <span>{hasRole('Administrador') ? 'es administrador' : 'no es administrador'}</span>
      <span>{message}</span>
      <button onClick={() => {
        void login('admin@farmacia.test', 'clave')
          .then(() => setMessage('login correcto'))
          .catch((error: Error) => setMessage(error.message));
      }}>Ingresar</button>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('restaura una sesión válida desde localStorage y permite cerrarla', async () => {
    localStorage.setItem('fs_token', 'token-guardado');
    localStorage.setItem('fs_usuario', JSON.stringify({
      id: 1,
      nombre: 'Admin QA',
      email: 'admin@farmacia.test',
      rol: 'Administrador',
    }));

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    expect(await screen.findByText('Administrador')).toBeTruthy();
    expect(screen.getByText('es administrador')).toBeTruthy();

    fireEvent.click(screen.getByText('Cerrar sesión'));

    await waitFor(() => expect(screen.getByText('sin sesión')).toBeTruthy());
    expect(localStorage.getItem('fs_token')).toBeNull();
    expect(localStorage.getItem('fs_usuario')).toBeNull();
  });

  it('guarda token y usuario al autenticar correctamente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'token-nuevo',
        usuario: {
          id: 1,
          nombre: 'Admin QA',
          email: 'admin@farmacia.test',
          rol: 'Administrador',
        },
      }),
    }));

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    fireEvent.click(await screen.findByText('Ingresar'));

    expect(await screen.findByText('login correcto')).toBeTruthy();
    expect(localStorage.getItem('fs_token')).toBe('token-nuevo');
    expect(JSON.parse(localStorage.getItem('fs_usuario') ?? '{}').rol).toBe('Administrador');
    expect(localStorage.getItem('fs_login_at')).not.toBeNull();
  });

  it('propaga el mensaje de error del servidor al fallar el inicio de sesión', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Credenciales inválidas' }),
    }));

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    fireEvent.click(await screen.findByText('Ingresar'));

    expect(await screen.findByText('Credenciales inválidas')).toBeTruthy();
    expect(localStorage.getItem('fs_token')).toBeNull();
  });
});
