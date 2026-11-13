import { TrendingUp, TrendingDown, Package, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ventasData = [
  { mes: 'Ene', ventas: 45000 },
  { mes: 'Feb', ventas: 52000 },
  { mes: 'Mar', ventas: 48000 },
  { mes: 'Abr', ventas: 61000 },
  { mes: 'May', ventas: 58000 },
  { mes: 'Jun', ventas: 67000 },
];

const productosTopData = [
  { nombre: 'Paracetamol', ventas: 450 },
  { nombre: 'Ibuprofeno', ventas: 380 },
  { nombre: 'Amoxicilina', ventas: 320 },
  { nombre: 'Omeprazol', ventas: 290 },
  { nombre: 'Losartán', ventas: 250 },
];

export default function Dashboard() {
  const metrics = [
    {
      label: 'Ventas del Mes',
      value: 'S/. 67,450',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      label: 'Productos en Stock',
      value: '1,243',
      change: '-3.2%',
      trend: 'down',
      icon: Package,
    },
    {
      label: 'Ventas del Día',
      value: 'S/. 2,180',
      change: '+8.1%',
      trend: 'up',
      icon: Calendar,
    },
    {
      label: 'Alertas Críticas',
      value: '14',
      change: '+2',
      trend: 'alert',
      icon: AlertTriangle,
    },
  ];

  const alerts = [
    {
      type: 'danger',
      title: 'Productos Próximos a Vencer',
      items: [
        { nombre: 'Amoxicilina 500mg', lote: 'L2024-045', vencimiento: '15/04/2026', stock: 45 },
        { nombre: 'Paracetamol 500mg', lote: 'L2024-089', vencimiento: '20/04/2026', stock: 120 },
        { nombre: 'Ibuprofeno 400mg', lote: 'L2024-067', vencimiento: '22/04/2026', stock: 78 },
      ],
    },
    {
      type: 'warning',
      title: 'Stock Bajo',
      items: [
        { nombre: 'Losartán 50mg', stock: 12, minimo: 50 },
        { nombre: 'Metformina 850mg', stock: 8, minimo: 30 },
        { nombre: 'Atorvastatina 20mg', stock: 15, minimo: 40 },
      ],
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl text-white mb-1">Dashboard</h2>
        <p className="text-muted-foreground">Resumen general del sistema</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-[oklch(0.269_0_0)] rounded-lg">
                  <Icon className="w-5 h-5 text-[oklch(0.488_0.243_264.376)]" />
                </div>
                {metric.trend === 'up' && (
                  <span className="flex items-center gap-1 text-sm text-[oklch(0.696_0.17_162.48)]">
                    <TrendingUp className="w-4 h-4" />
                    {metric.change}
                  </span>
                )}
                {metric.trend === 'down' && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingDown className="w-4 h-4" />
                    {metric.change}
                  </span>
                )}
                {metric.trend === 'alert' && (
                  <span className="flex items-center gap-1 text-sm text-[oklch(0.645_0.246_16.439)]">
                    {metric.change}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
              <p className="text-2xl text-white">{metric.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas Mensuales */}
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
          <h3 className="text-lg text-white mb-6">Ventas Mensuales</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ventasData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.269 0 0)" />
              <XAxis dataKey="mes" stroke="oklch(0.708 0 0)" />
              <YAxis stroke="oklch(0.708 0 0)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.269 0 0)',
                  border: '1px solid oklch(0.269 0 0)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Line
                type="monotone"
                dataKey="ventas"
                stroke="oklch(0.488 0.243 264.376)"
                strokeWidth={2}
                dot={{ fill: 'oklch(0.488 0.243 264.376)', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Productos Más Vendidos */}
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
          <h3 className="text-lg text-white mb-6">Productos Más Vendidos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={productosTopData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.269 0 0)" />
              <XAxis type="number" stroke="oklch(0.708 0 0)" />
              <YAxis dataKey="nombre" type="category" stroke="oklch(0.708 0 0)" width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.269 0 0)',
                  border: '1px solid oklch(0.269 0 0)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Bar dataKey="ventas" fill="oklch(0.696 0.17 162.48)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {alerts.map((alert, index) => (
          <div key={index} className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className={`w-5 h-5 ${alert.type === 'danger' ? 'text-[oklch(0.645_0.246_16.439)]' : 'text-[oklch(0.769_0.188_70.08)]'}`} />
              <h3 className="text-lg text-white">{alert.title}</h3>
            </div>
            <div className="space-y-3">
              {alert.items.map((item, idx) => (
                <div key={idx} className="bg-[oklch(0.269_0_0)] rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white mb-1">{item.nombre}</p>
                      {'vencimiento' in item && (
                        <p className="text-xs text-muted-foreground">
                          Lote: {item.lote} • Vence: {item.vencimiento}
                        </p>
                      )}
                      {'minimo' in item && (
                        <p className="text-xs text-muted-foreground">
                          Stock mínimo: {item.minimo} unidades
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      alert.type === 'danger'
                        ? 'bg-[oklch(0.396_0.141_25.723)] text-[oklch(0.645_0.246_16.439)]'
                        : 'bg-[oklch(0.769_0.188_70.08)]/20 text-[oklch(0.769_0.188_70.08)]'
                    }`}>
                      {item.stock} unid.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
