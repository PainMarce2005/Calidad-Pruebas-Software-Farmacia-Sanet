# Integración de API

`tests/api.test.js` comprueba la API Express mediante Supertest. Las suites `negative.test.js` y `negative-all.test.js` agrupan escenarios inválidos y límites; todas ejercitan el backend original en `backend/`.

Desde la raíz:

```powershell
npm run test:api
npm run test:negative
npm run test:negative-all
npm run test:gaps
```

Se requiere MySQL activo, `backend/.env` configurado y las cuentas de prueba correspondientes. Los reportes HTML/JSON se guardan bajo `reports/` dentro de cada etapa. `test:gaps` ejecuta dos casos deliberadamente fallidos para la persistencia del correo de clientes; `test:client-gap-ui` comprueba el campo de correo en el formulario. Son propuestas de requisito, se ejecutan por separado y no forman parte de `npm test` ni de CI. Las suites pueden modificar datos de prueba; ejecútalas contra una base de datos de pruebas, nunca contra producción.

La evidencia guardada registra 16/16 pruebas de integración, 19/19 negativas y 23/23 negativas ampliadas. En CI se ejecutan contra MySQL con esquema sintético aislado; en local, usa exclusivamente la base QA de Docker. Las capturas del pipeline de GitHub Actions y del estado de Docker son evidencia visual de CI/CD y se presentan separadas de estos reportes de pruebas.
