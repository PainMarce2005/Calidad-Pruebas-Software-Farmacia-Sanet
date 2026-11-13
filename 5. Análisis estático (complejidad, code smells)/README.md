# Análisis estático

## Herramienta y configuración

ESLint 10 analiza JavaScript del backend y TypeScript/TSX de `frontend/src`; typescript-eslint procesa TypeScript y `eslint-plugin-react-hooks` valida dependencias de efectos. Se excluyen `node_modules`, `dist` y los reportes. Las reglas recomendadas detectan errores y variables no usadas; además se reporta complejidad ciclomática superior a 15 y uso de `any`.

Ejecuta `npm run lint` para consultar la salida legible o `npm run lint:report` para regenerar el JSON en `reports/`. El CI también ejecuta el análisis: los errores fallan el pipeline y el límite de advertencias se fija en el baseline actual para evitar regresiones.

## Resultado verificado

En la última ejecución se analizaron **88 archivos**, con **0 errores** y **37 advertencias**:

| Hallazgo | Cantidad | Lectura |
|---|---:|---|
| Uso de `any` | 31 | Reduce las garantías de tipos en el frontend; reemplazar gradualmente por interfaces de dominio. |
| Complejidad > 15 | 6 | Cuatro funciones de producto/ventas y dos componentes de gráficos requieren posible extracción de lógica. |

El reporte JSON se genera en `reports/static-analysis-report.json`.

Estas advertencias son una línea base de deuda técnica, no defectos funcionales confirmados. Priorizar la complejidad 45 de `Ventas` y 28 de `UsuarioFormModal`, luego reducir `any` en los modelos compartidos.
