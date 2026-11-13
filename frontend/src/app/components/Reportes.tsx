import { BarChart3, TrendingUp, FileText, Calendar } from 'lucide-react';

export default function Reportes() {
  const reportes = [
    {
      id: 1,
      nombre: 'Ventas Mensuales',
      descripcion: 'Reporte detallado de ventas por mes',
      icon: TrendingUp,
      color: 'oklch(0.488_0.243_264.376)'
    },
    {
      id: 2,
      nombre: 'Productos Más Vendidos',
      descripcion: 'Ranking de productos con mayor rotación',
      icon: BarChart3,
      color: 'oklch(0.696_0.17_162.48)'
    },
    {
      id: 3,
      nombre: 'Inventario Valorizado',
      descripcion: 'Valor total del stock actual',
      icon: FileText,
      color: 'oklch(0.769_0.188_70.08)'
    },
    {
      id: 4,
      nombre: 'Vencimientos Próximos',
      descripcion: 'Productos por vencer en los próximos 30 días',
      icon: Calendar,
      color: 'oklch(0.645_0.246_16.439)'
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl text-white mb-1">Reportes</h2>
        <p className="text-muted-foreground">Generación de reportes y análisis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportes.map(reporte => {
          const Icon = reporte.icon;
          return (
            <div
              key={reporte.id}
              className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6 hover:border-[oklch(0.488_0.243_264.376)] transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[oklch(0.269_0_0)] rounded-xl group-hover:bg-[oklch(0.488_0.243_264.376)] transition-colors">
                  <Icon className={`w-6 h-6 text-[${reporte.color}] group-hover:text-white transition-colors`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg text-white mb-2">{reporte.nombre}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{reporte.descripcion}</p>
                  <button className="text-sm text-[oklch(0.488_0.243_264.376)] hover:text-white transition-colors">
                    Generar Reporte →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
