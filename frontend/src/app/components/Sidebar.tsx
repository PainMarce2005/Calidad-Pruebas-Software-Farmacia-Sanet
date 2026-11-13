import {
  LayoutDashboard, ShoppingCart, Package,
  ShoppingBag, BookOpen, BarChart3, Users, LogOut, Shield,
  UserCircle2, Clock, History,
} from 'lucide-react';
import { useAuth, Rol } from '../context/AuthContext';
import { puedeAcceder } from '../config/permisos';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout:   () => void;
}

const ALL_MENU_ITEMS = [
  { id: 'dashboard',       label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'ventas',          label: 'Ventas',             icon: ShoppingCart    },
  { id: 'inventario',      label: 'Inventario',         icon: Package         },
  { id: 'compras',         label: 'Compras',            icon: ShoppingBag     },
  { id: 'catalogos',       label: 'Catálogos',          icon: BookOpen        },
  { id: 'reportes',        label: 'Reportes',           icon: BarChart3       },
  { id: 'clientes',        label: 'Clientes',           icon: UserCircle2     },
  { id: 'usuarios',        label: 'Usuarios',           icon: Users           },
  { id: 'historial_login', label: 'Historial de Accesos', icon: History       }, // ← NUEVA
];

const ROL_BADGE: Record<Rol, { label: string; color: string }> = {
  Administrador: { label: 'Admin',      color: 'text-[oklch(0.488_0.243_264.376)] bg-[oklch(0.488_0.243_264.376)]/10' },
  Supervisor:    { label: 'Supervisor', color: 'text-[oklch(0.769_0.188_70.08)] bg-[oklch(0.769_0.188_70.08)]/10'     },
  Vendedor:      { label: 'Vendedor',   color: 'text-[oklch(0.696_0.17_162.48)] bg-[oklch(0.696_0.17_162.48)]/10'     },
};

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Sidebar({ activeView, onNavigate, onLogout }: SidebarProps) {
  const { usuario, onlineSeconds } = useAuth();
  const rol = usuario?.rol as Rol;

  const menuItems = ALL_MENU_ITEMS.filter((item) => puedeAcceder(rol, item.id));
  const badge = ROL_BADGE[rol] ?? { label: rol, color: 'text-muted-foreground bg-muted' };

  return (
    <aside className="w-64 bg-[oklch(0.205_0_0)] border-r border-[oklch(0.269_0_0)] flex flex-col h-screen">

      {/* Header */}
      <div className="p-6 border-b border-[oklch(0.269_0_0)]">
        <h1 className="text-xl text-white">Farmacia Sanet</h1>
        <p className="text-xs text-muted-foreground mt-1">Sistema de Gestión</p>
      </div>

      {/* Usuario + Timer */}
      {usuario && (
        <div className="px-4 py-3 border-b border-[oklch(0.269_0_0)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[oklch(0.488_0.243_264.376)]/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-[oklch(0.488_0.243_264.376)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{usuario.nombre}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 bg-[oklch(0.269_0_0)] rounded-lg px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 text-[oklch(0.488_0.243_264.376)] flex-shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-muted-foreground">Tiempo en línea</span>
              <span className="font-mono text-sm text-white tracking-wider">
                {formatDuration(onlineSeconds)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon     = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive
                  ? 'bg-[oklch(0.488_0.243_264.376)] text-white'
                  : 'text-muted-foreground hover:bg-[oklch(0.269_0_0)] hover:text-white'}
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[oklch(0.269_0_0)]">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-[oklch(0.269_0_0)] hover:text-destructive transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
