# Pruebas End-to-End (E2E)

`specs/` contiene recorridos Selenium agrupados por funcionalidad; `pages/` mantiene los Page Objects y utilidades compartidas, y `features/` reúne las especificaciones Gherkin existentes.

Desde la raíz:

```powershell
npm run test:e2e
```

Los casos propuestos de correo ausente y accesibilidad se ejecutan por separado con `npm run test:client-gap-ui` y `npm run test:client-a11y-gaps`; sus reportes quedan en `reports/gaps/mochawesome/`. Se espera que fallen hasta que se implementen y confirmen estos criterios; no forman parte de `npm test` ni de CI.

Antes de ejecutar, inicia MySQL, el backend (`npm start --prefix backend`) y el frontend (`npm run dev --prefix frontend`). La suite genera reportes HTML/JSON en `reports/mochawesome/`. Las operaciones de prueba pueden crear y limpiar datos; utiliza una base de datos aislada.

El reporte más reciente registra 16/16 pruebas aprobadas. CP11 tuvo una falla previa por sincronización del listado; después del ajuste en el Page Object se obtuvieron dos ejecuciones completas consecutivas aprobadas. Esto no sustituye una campaña extensa de estabilidad.
