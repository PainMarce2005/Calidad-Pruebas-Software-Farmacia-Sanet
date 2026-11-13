# Sistema de Gestión de Ventas

Aplicación para administrar ventas, inventario, compras, clientes, usuarios y catálogos de una farmacia. `backend/` y `frontend/` contienen la aplicación; las carpetas numeradas conservan el código y la configuración de pruebas. El proyecto incluye sus dependencias de ejecución, esquema de base de datos y configuración de QA.

## Estructura

```text
backend/                                  API, persistencia, servicios y lógica de negocio
frontend/                                 Interfaz React y configuración de Vite
database/                                 Esquema y preparación de la base QA
1. Unitarias (cliente y servidor)/        Pruebas unitarias
2. Integración_API (servidor Node.js)/    Pruebas de integración y escenarios negativos
3. End-to-End (E2E) en navegador/        Selenium, Page Objects y Gherkin
4. Cobertura de código (JavaScript)/      Reportes c8
5. Análisis estático (...)/               Reportes ESLint
6. Rendimiento (...)/                     Escenario de carga k6
7. Reportes y tendencias de pruebas/      Generador UniReport y tendencias
.github/workflows/                        Verificaciones automáticas de CI
docker-compose.yml                        Servicios locales para aplicación y QA
package.json                              Comandos centralizados de la aplicación y QA
```

La lógica de la aplicación permanece en `backend/` y `frontend/`; no se copia al material de pruebas. Los comandos de QA están centralizados en este `package.json`, con las dependencias de servidor en `backend/` y las de interfaz en `frontend/`.

## Correspondencia con el ejemplo del profesor

Se conservan los mismos nombres y el mismo orden de las siete etapas numeradas, para que se puedan ubicar de inmediato. Las diferencias en la aplicación son intencionales:

| Ejemplo del profesor | Este proyecto | Por qué se conserva esta forma |
|---|---|---|
| `app/` | `frontend/` | Interfaz React/Vite con Docker y configuración de compilación propios. |
| `servidor/` | `backend/` | API Express con dependencias, Dockerfile y configuración propios. |
| Sin carpeta equivalente | `database/` | Esquema y preparación aislada de la base de datos de QA. |
| Jest y Playwright, con configuración junto a cada etapa | Mocha, Selenium y c8; comandos QA en el `package.json` raíz | Son las herramientas instaladas y ejecutadas por el proyecto y CI. |
| Siete carpetas de pruebas | Las mismas siete carpetas | Pruebas unitarias, API, E2E, cobertura, análisis estático, rendimiento y consolidación. |

No se renombran `frontend/` y `backend/` como `app/` y `servidor/`: sus nombres actuales describen con precisión las capas y son usados por Docker, scripts y CI. `package-lock.json` (raíz, backend y frontend) define npm como único gestor de paquetes. Los reportes generados por las pruebas se guardan en las carpetas `reports/` de cada etapa.

## Requisitos

- Node.js 22 o posterior (o Node.js 20.19 o posterior) y npm.
- MySQL configurado para la API y las pruebas de integración.
- Chrome o Edge para Selenium.
- Docker Desktop con Compose para MySQL, API, interfaz y k6.

No publiques credenciales ni archivos `.env`. Para Docker, copia `.env.example` a `.env` y configura contraseñas aleatorias locales distintas para MySQL y el secreto JWT. El archivo `.env` está excluido del control de versiones.

## Instalación y ejecución

El esquema `database/Base - Datos.sql` se incluye en el proyecto. Docker lo monta en modo solo lectura e inicializa una base exclusiva para QA. Una migración QA añade los estados de producto que utiliza la aplicación sin modificar el SQL. La importación ocurre únicamente al crear el volumen por primera vez.

Levanta MySQL, API y frontend, y prepara las cuentas de prueba:

```powershell
npm run docker:up
npm run docker:seed
```

La aplicación estará en `http://localhost:5173`, la API en `http://localhost:3001` y MySQL estará disponible solo localmente en `127.0.0.1:3307`. Apaga los servicios sin borrar los datos de QA con:

```powershell
npm run docker:down
```

Para volver a importar el SQL desde cero, primero confirma que no necesitas los datos de QA: `docker compose down --volumes` elimina el volumen de la base.

Las suites de API y Selenium se ejecutan desde el host una vez que Docker esté listo:

```powershell
npm run test:api
npm run test:negative
npm run test:negative-all
npm run test:e2e
```

`npm test` ejecuta las suites unitarias, API, ambas suites negativas y E2E en secuencia; se detiene si una suite falla y, si todas pasan, genera UniReport al final. La carga y el estrés con k6 se ejecutan por separado mediante `npm run test:performance` y `npm run test:stress`.

Para desarrollar sin contenedores, instala dependencias con `npm ci`, `npm ci --prefix backend` y `npm ci --prefix frontend`. Configura `backend/.env` con `DB_HOST=127.0.0.1` y `DB_PORT=3307`, luego inicia `npm start --prefix backend` y `npm run dev --prefix frontend` en terminales separadas. La API y Vite usan los puertos 3001 y 5173. Compila el frontend con:

```powershell
npm run build
```

## Pruebas centralizadas

Todos estos comandos se ejecutan desde la raíz. Los comandos equivalentes de backend también se conservan como delegadores (`npm run test:unit --prefix backend`, por ejemplo).

| Comando | Alcance | Requisitos adicionales |
|---|---|---|
| `npm run test:unit` | Cálculos, builders y observadores; sin Express ni MySQL | Ninguno |
| `npm run test:coverage` | Suite unitaria con cobertura de líneas, funciones y ramas (c8) | Ninguno |
| `npm run lint` | Análisis estático de backend JS y frontend TS/TSX | Ninguno |
| `npm run lint:report` | Regenera el reporte JSON de ESLint | Ninguno |
| `npm run test:api` | Integración de API, autenticación, permisos y operaciones | MySQL, `.env` y cuentas de prueba |
| `npm run test:negative` | Entradas no válidas y respuestas de API | MySQL, `.env` y cuentas de prueba |
| `npm run test:negative-all` | Suite negativa ampliada | MySQL, `.env` y cuenta administradora |
| `npm run test:gaps` | Dos casos deliberadamente fallidos sobre persistencia de email de clientes (propuesta US-03) | MySQL, `.env` y cuenta administradora |
| `npm run test:client-gap-ui` | Caso E2E deliberadamente fallido por ausencia del campo de email de clientes | Stack QA, Chrome y credenciales |
| `npm run test:client-a11y-gaps` | Tres casos E2E propuestos de accesibilidad en el formulario de clientes | Stack QA, Chrome y credenciales |
| `npm run test:e2e` | Flujos del navegador con Selenium | API, frontend, base de datos y Chrome o Edge |
| `npm run test:performance` | Carga autenticada con k6 dentro de Docker | Stack QA levantado y cuenta administradora preparada |
| `npm run test:stress` | Estrés progresivo autenticado con k6 (hasta 50 VU) | Stack QA levantado y cuenta administradora preparada |
| `npm run report` | Consolida reportes Mochawesome, c8, ESLint y k6 en UniReport | Haber generado al menos un reporte Mochawesome |
| `npm test` | Unitarias, API, negativas, negativas ampliadas y E2E; luego genera UniReport | Requisitos de API y E2E |

Los comandos `test:gaps`, `test:client-gap-ui` y `test:client-a11y-gaps` quedan fuera de `npm test` y del pipeline porque documentan brechas propuestas que todavía no forman parte de criterios confirmados. Sus reportes HTML/JSON se conservan dentro del proyecto.

Para cambiar URL o credenciales de pruebas se admiten `API_URL`, `BASE_URL`, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, `TEST_SUPERVISOR_EMAIL`, `TEST_SUPERVISOR_PASSWORD`, `TEST_SELLER_EMAIL` y `TEST_SELLER_PASSWORD`. `SELENIUM_BROWSER` selecciona `chrome` (predeterminado) o `edge`; `HEADLESS=false` desactiva el modo headless.

## Pruebas y reportes

- [Suite unitaria](./1.%20Unitarias%20%28cliente%20y%20servidor%29/README.md)
- [Integración de API](./2.%20Integraci%C3%B3n_API%20%28servidor%20Node.js%29/README.md)
- [Pruebas E2E](./3.%20End-to-End%20%28E2E%29%20en%20navegador/README.md)
- [Pruebas de rendimiento](./6.%20Rendimiento%20%28tiempos%20de%20respuesta%2C%20throughput%29/README.md)

Al ejecutar las pruebas, sus resultados se generan en las rutas `reports/` indicadas por cada suite. GitHub Actions automatiza ESLint, cobertura unitaria, build frontend, integración/negativas contra MySQL sintético, E2E con Chrome y carga/estrés con k6.

Cada ejecución publica los reportes como artefactos descargables en **Actions → Quality checks → ejecución → Artifacts**:

- `backend-unit-reports`: resultados unitarios, cobertura c8 y análisis estático.
- `api-e2e-performance-reports`: resultados de integración, casos negativos, Selenium, k6 y UniReport.

Los artefactos tienen una retención de 90 días. Descarga el ZIP para abrir los informes HTML o consultar los JSON. Las ejecuciones también dejan el historial del pipeline en Actions; los reportes base versionados permanecen en las carpetas `reports/` del proyecto.

Las capturas de GitHub Actions y Docker son evidencias visuales de CI/CD y demostración, y se presentan por separado de los reportes automatizados de casos de prueba. Por eso no se guardan en las carpetas `reports/`: allí se conservan los resultados HTML/JSON generados por las suites. k6 corre en contenedor tanto localmente como en el flujo de CI.
