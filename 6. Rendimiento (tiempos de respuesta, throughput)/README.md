# Pruebas de rendimiento con k6

`performance.js` realiza carga autenticada sobre el catálogo de productos. La prueba usa 10 usuarios virtuales durante 30 segundos y comprueba los umbrales configurados: `p(95) < 500 ms`, errores HTTP `< 1 %` y checks exitosos `> 99 %`. `stress.js` aumenta progresivamente hasta 50 VU durante 105 segundos y usa `p(95) < 800 ms` con los mismos umbrales de error y checks.

Requiere Docker Compose y el stack QA activo, además de una cuenta de prueba válida. k6 se ejecuta en su propio contenedor y se conecta al backend por la red interna de Compose. Desde la raíz:

```powershell
npm run test:performance
npm run test:stress
```

Los reportes JSON/HTML se generan en `reports/`. Las ejecuciones de GitHub Actions también los publican dentro del artefacto `api-e2e-performance-reports`, junto con los demás resultados de QA. Los resultados registrados fueron: carga 300 iteraciones, p95 9.87 ms y 0 % de errores; estrés 97,639 iteraciones, p95 49.12 ms y 0 % de errores. Las solicitudes ejercitan lectura del catálogo, no transacciones de venta ni un despliegue productivo. La imagen está fijada en k6 2.4.0. Registra fecha, ambiente y resultados junto con cada ejecución. Utiliza solo QA local o la base sintética de CI, nunca producción. Los umbrales son criterios del proyecto, no una certificación de una norma.
