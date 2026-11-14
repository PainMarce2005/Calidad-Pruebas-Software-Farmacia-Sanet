import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';

describe('apiClient', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('envía el token y conserva encabezados y opciones del llamador', async () => {
    localStorage.setItem('fs_token', 'token-de-prueba');
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiClient('/api/productos', {
      method: 'GET',
      headers: { 'X-QA': 'suite' },
    });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/productos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-QA': 'suite',
        Authorization: 'Bearer token-de-prueba',
      },
    });
  });

  it('limpia la sesión y vuelve al login cuando la API responde 401', async () => {
    localStorage.setItem('fs_token', 'vencido');
    localStorage.setItem('fs_usuario', '{"rol":"Vendedor"}');
    const reload = vi.fn();
    vi.stubGlobal('window', { location: { reload } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await apiClient('/api/productos');

    expect(localStorage.getItem('fs_token')).toBeNull();
    expect(localStorage.getItem('fs_usuario')).toBeNull();
    expect(reload).toHaveBeenCalledOnce();
  });
});
