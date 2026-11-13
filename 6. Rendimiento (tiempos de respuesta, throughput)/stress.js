import http from 'k6/http';
import { check } from 'k6';

const baseUrl = __ENV.API_URL || 'http://localhost:3001';
const email = __ENV.TEST_ADMIN_EMAIL || 'admin@farmacia.com';
const password = __ENV.TEST_ADMIN_PASSWORD || 'Admin123!';

export const options = {
  scenarios: {
    product_catalog_stress: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '30s', target: 25 },
        { duration: '30s', target: 50 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
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
    throw new Error(`Login for the stress test failed with HTTP ${response.status}`);
  }

  return { token: response.json('token') };
}

export default function (data) {
  const response = http.get(`${baseUrl}/api/productos`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });

  check(response, {
    'catalog responds with HTTP 200': (result) => result.status === 200,
    'catalog returns a JSON array': (result) => {
      try {
        return Array.isArray(result.json());
      } catch {
        return false;
      }
    },
  });
}

export function handleSummary(data) {
  const duration = data.metrics.http_req_duration.values;
  const errorRate = data.metrics.http_req_failed.values.rate;
  const checkRate = data.metrics.checks.values.rate;
  const summary = {
    test: 'Estrés progresivo autenticado de GET /api/productos',
    generatedAt: new Date().toISOString(),
    peakVirtualUsers: data.metrics.vus_max.values.max,
    iterations: data.metrics.iterations.values.count,
    requests: data.metrics.http_reqs.values.count,
    requestsPerSecond: data.metrics.http_reqs.values.rate,
    responseTimeMs: {
      average: duration.avg,
      p95: duration['p(95)'],
      maximum: duration.max,
    },
    httpErrorRate: errorRate,
    checkPassRate: checkRate,
    thresholds: {
      p95Below800ms: duration['p(95)'] < 800,
      httpErrorRateBelow1Percent: errorRate < 0.01,
      checksAbove99Percent: checkRate > 0.99,
    },
  };

  return {
    '6. Rendimiento (tiempos de respuesta, throughput)/reports/stress-summary.json':
      `${JSON.stringify(summary, null, 2)}\n`,
    stdout: `Stress test summary\n${JSON.stringify(summary, null, 2)}\n`,
  };
}
