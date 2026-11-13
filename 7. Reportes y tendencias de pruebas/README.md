# 7. Reportes y tendencias

Esta etapa consolida los resultados del proyecto sin sustituir los informes detallados de cada suite. El generador consume los JSON de Mochawesome, c8, ESLint y k6 que producen las etapas anteriores.

## Archivos

- `unireport.cjs`: lee los resultados disponibles, calcula el pass rate de las ejecuciones y genera el dashboard.
- `reports/unireport.html`: resumen visual que se genera al ejecutar el comando de reporte.
- `reports/unireport-history.json`: hasta 30 resúmenes para comparar generaciones distintas.

## Generar el reporte

Desde la raíz del proyecto:

```powershell
npm run report
```

Para ejecutar primero todas las suites configuradas y luego consolidar sus resultados:

```powershell
npm test
```

El dashboard se puede abrir en el navegador desde `7. Reportes y tendencias de pruebas/reports/unireport.html`. Volver a generar el dashboard sin cambios en los JSON fuente no duplica el mismo registro del historial. El historial conserva como máximo 30 entradas.

## Interpretación y límites

- **Pass rate** = pruebas aprobadas ÷ pruebas ejecutadas (aprobadas + fallidas). El total suma los reportes disponibles; las suites negativas se solapan y no representan requisitos únicos.
- La carpeta presenta `N/D` si no existe un reporte complementario; si falta una suite, el estado general aparece como parcial.
- Cobertura c8 se limita a los módulos incluidos en la instrumentación. ESLint cuenta advertencias, no defectos confirmados.
- k6 sólo mide los escenarios guardados de lectura del catálogo; no extrapolar los resultados al entorno de producción.
- Estabilidad/flakiness y defect leakage aparecen como no disponibles cuando no hay datos verificables para calcularlos.

Al ejecutar pruebas, los reportes de origen se vuelven a generar en las etapas 1 a 6; el dashboard y su historial se generan localmente en esta etapa.
