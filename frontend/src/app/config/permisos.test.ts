import { describe, expect, it } from 'vitest';
import { OPERACIONES, PERMISOS, puedeAcceder } from './permisos';
import type { Rol } from '../context/AuthContext';

const roles: Rol[] = ['Administrador', 'Supervisor', 'Vendedor'];

describe('Matriz de acceso por rol', () => {
  it('aplica los permisos declarados para cada vista', () => {
    for (const [view, allowedRoles] of Object.entries(PERMISOS)) {
      for (const role of roles) {
        expect(puedeAcceder(role, view)).toBe(allowedRoles.includes(role));
      }
    }
  });

  it('deniega vistas desconocidas y operaciones administrativas a vendedor', () => {
    expect(puedeAcceder('Administrador', 'vista_inexistente')).toBe(false);
    expect(OPERACIONES.eliminarProducto).toEqual(['Administrador']);
    expect(OPERACIONES.gestionarUsuarios).toEqual(['Administrador']);
    expect(OPERACIONES.crearVenta).toContain('Vendedor');
  });
});
