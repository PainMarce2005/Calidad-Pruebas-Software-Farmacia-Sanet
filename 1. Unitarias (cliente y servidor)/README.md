# Pruebas unitarias

La suite valida funciones y patrones de negocio del backend sin iniciar Express ni conectarse a MySQL.

Desde la raíz del proyecto:

```powershell
npm run test:unit
npm run test:coverage
```

Al ejecutar las pruebas, los resultados HTML/JSON se generan en `reports/unitarias/`; la cobertura c8 se escribe en la etapa [4](../4.%20Cobertura%20de%20c%C3%B3digo%20%28JavaScript%29/README.md). La última ejecución registrada es 12/12 aprobadas. `unit.test.js` referencia la implementación original en `backend/`; no se duplica lógica de producción en esta carpeta.
