import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { check, sleep } from 'k6';

const baseUrl = __ENV.API_URL || 'http://localhost:3001';
const email = __ENV.TEST_ADMIN_EMAIL || 'admin@farmacia.com';
const password = __ENV.TEST_ADMIN_PASSWORD || 'Admin123!';
const productRequests = new Counter('product_catalog_requests');

export const options = {
  scenarios: {
    product_catalog: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

export function setup() {
  const response = http.post(
    `${baseUrl}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const loginSucceeded = check(response, {
    'login responds with HTTP 200': (result) => result.status === 200,
    'login returns a JWT': (result) => Boolean(result.json('token')),
  });

  if (!loginSucceeded) {
    throw new Error(`Login for the performance test failed with HTTP ${response.status}`);
  }

  return { token: response.json('token') };
}

export default function (data) {
  productRequests.add(1);
  const response = http.get(`${baseUrl}/api/productos`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });

  check(response, {
    'GET /api/productos responds with HTTP 200': (result) => result.status === 200,
    'GET /api/productos returns a JSON array': (result) => {
      try {
        return Array.isArray(result.json());
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}

export function handleSummary(data) {
  const metrics = data.metrics;
  const responseTime = metrics.http_req_duration.values;
  const errorRate = metrics.http_req_failed.values.rate;
  const checkRate = metrics.checks.values.rate;
  const productRequestRate = metrics.product_catalog_requests.values.rate;
  const summary = {
    test: 'GET /api/productos bajo carga autenticada',
    generatedAt: new Date().toISOString(),
    virtualUsers: metrics.vus_max.values.max,
    iterations: metrics.iterations.values.count,
    requests: metrics.http_reqs.values.count,
    productRequestsPerSecond: productRequestRate,
    responseTimeMs: {
      average: responseTime.avg,
      p95: responseTime['p(95)'],
      maximum: responseTime.max,
    },
    httpErrorRate: errorRate,
    checkPassRate: checkRate,
    thresholds: {
      p95Below500ms: responseTime['p(95)'] < 500,
      httpErrorRateBelow1Percent: errorRate < 0.01,
      checksAbove99Percent: checkRate > 0.99,
    },
  };
  const report = JSON.stringify(summary, null, 2);
  const percent = (value) => `${(value * 100).toFixed(2)}%`;
  const thresholdRow = (name, result, threshold, passed) => `
          <tr><td>${name}</td><td>${result}</td><td>${threshold}</td><td class="${passed ? 'pass' : 'fail'}">${passed ? 'Cumplido' : 'No cumplido'}</td></tr>`;
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reporte de rendimiento k6</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #172033; background: #f3f6fb; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px 16px; }
    main { max-width: 960px; margin: 0 auto; }
    header, section { background: #fff; border: 1px solid #e1e7f0; border-radius: 14px; padding: 24px; margin-bottom: 18px; box-shadow: 0 5px 18px rgba(23, 32, 51, .05); }
    h1 { margin: 0 0 8px; font-size: clamp(1.5rem, 4vw, 2rem); }
    h2 { margin: 0 0 16px; font-size: 1.15rem; }
    .muted { color: #596579; margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .metric { border: 1px solid #e1e7f0; border-radius: 10px; padding: 16px; }
    .metric span { display: block; color: #596579; font-size: .9rem; }
    .metric strong { display: block; margin-top: 6px; font-size: 1.45rem; overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid #e1e7f0; }
    th { color: #596579; font-weight: 600; }
    .pass { color: #087443; font-weight: 700; }
    .fail { color: #b42318; font-weight: 700; }
    @media (max-width: 560px) { body { padding: 16px 10px; } header, section { padding: 18px; } th, td { padding: 10px 6px; font-size: .9rem; } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Reporte de rendimiento</h1>
      <p class="muted">${summary.test} · Generado: ${summary.generatedAt}</p>
    </header>
    <section aria-labelledby="metrics-title">
      <h2 id="metrics-title">Métricas de ejecución</h2>
      <div class="grid">
        <div class="metric"><span>Latencia p95</span><strong>${responseTime['p(95)'].toFixed(2)} ms</strong></div>
        <div class="metric"><span>Peticiones de productos por segundo</span><strong>${productRequestRate.toFixed(2)} req/s</strong></div>
        <div class="metric"><span>Tasa de errores HTTP</span><strong>${percent(errorRate)}</strong></div>
        <div class="metric"><span>Usuarios virtuales</span><strong>${summary.virtualUsers}</strong></div>
        <div class="metric"><span>Peticiones al catálogo</span><strong>${metrics.product_catalog_requests.values.count}</strong></div>
        <div class="metric"><span>Checks satisfactorios</span><strong>${percent(checkRate)}</strong></div>
      </div>
    </section>
    <section aria-labelledby="thresholds-title">
      <h2 id="thresholds-title">Umbrales de aceptación</h2>
      <table>
        <thead><tr><th>Criterio</th><th>Resultado medido</th><th>Umbral</th><th>Estado</th></tr></thead>
        <tbody>${thresholdRow('Latencia p95', `${responseTime['p(95)'].toFixed(2)} ms`, '&lt; 500 ms', summary.thresholds.p95Below500ms)}
          ${thresholdRow('Errores HTTP', percent(errorRate), '&lt; 1%', summary.thresholds.httpErrorRateBelow1Percent)}
          ${thresholdRow('Checks satisfactorios', percent(checkRate), '&gt; 99%', summary.thresholds.checksAbove99Percent)}
        </tbody>
      </table>
      <p class="muted">El reporte contiene métricas agregadas y no incluye URL objetivo, credenciales ni tokens.</p>
    </section>
  </main>
</body>
</html>`;

  return {
    '6. Rendimiento (tiempos de respuesta, throughput)/reports/performance-summary.json': report,
    '6. Rendimiento (tiempos de respuesta, throughput)/reports/performance-report.html': html,
    stdout: `Performance test summary\n${report}\n`,
  };
}
