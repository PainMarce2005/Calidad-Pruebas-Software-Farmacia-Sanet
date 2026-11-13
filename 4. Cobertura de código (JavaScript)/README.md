# Cobertura de código

## Alcance y método

La cobertura se mide con c8 (V8) al ejecutar la suite unitaria, sin instrumentar dependencias ni iniciar la base de datos. El alcance medido son los tres módulos de negocio que importa esta suite: `backend/patterns/builders.js`, `backend/patterns/StockObserver.js` y `backend/services/VentaCalculator.js`. No representa la cobertura total del backend, sus rutas ni el frontend.

El comando `npm run test:coverage` genera HTML y JSON en `reports/`, conserva el reporte Mochawesome de las pruebas y falla si las líneas, funciones o ramas quedan por debajo de 90 %.

## Resultado verificado

La última ejecución aprobó **12/12 pruebas** y midió:

| Métrica | Resultado | Umbral |
|---|---:|---:|
| Líneas / sentencias | 100 % (361/361) | 90 % |
| Funciones | 100 % (36/36) | 90 % |
| Ramas | 100 % (66/66) | 90 % |

Abre el informe visual desde `reports/index.html` y consulta el resumen JSON en `reports/coverage-summary.json`.

El caso límite de estado de compra inválido también está cubierto. El alcance y las cifras deben ampliarse cuando se incorporen pruebas automatizadas para servicios y rutas.
