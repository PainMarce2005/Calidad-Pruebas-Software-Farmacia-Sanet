'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(__dirname, 'reports');
const HISTORY_FILE = path.join(REPORTS_DIR, 'unireport-history.json');
const OUTPUT_FILE = path.join(REPORTS_DIR, 'unireport.html');
const MAX_HISTORY = 30;

const MOCHA_REPORTS = [
  {
    name: 'Unitarias',
    file: '1. Unitarias (cliente y servidor)/reports/unitarias/unit-test-report.json',
  },
  {
    name: 'Integración API',
    file: '2. Integración_API (servidor Node.js)/reports/api/mochawesome/api-integration-report.json',
  },
  {
    name: 'Negativas API',
    file: '2. Integración_API (servidor Node.js)/reports/negative/mochawesome/negative-test-report.json',
  },
  {
    name: 'Negativas ampliadas',
    file: '2. Integración_API (servidor Node.js)/reports/negative/mochawesome/negative-all-report.json',
  },
  {
    name: 'E2E navegador',
    file: '3. End-to-End (E2E) en navegador/reports/mochawesome/e2e-report.json',
  },
];

const OPTIONAL_REPORTS = {
  coverage: '4. Cobertura de código (JavaScript)/reports/coverage-summary.json',
  eslint: '5. Análisis estático (complejidad, code smells)/reports/static-analysis-report.json',
  performance: '6. Rendimiento (tiempos de respuesta, throughput)/reports/performance-summary.json',
  stress: '6. Rendimiento (tiempos de respuesta, throughput)/reports/stress-summary.json',
};

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readJson(relativePath, label) {
  const absolutePath = path.join(ROOT_DIR, relativePath);
  if (!fs.existsSync(absolutePath)) return null;

  const raw = fs.readFileSync(absolutePath, 'utf8');
  let value;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new Error(`No se pudo leer el JSON de ${label} (${relativePath}): ${error.message}`);
  }

  return { value, raw };
}

function requireCount(stats, field, label) {
  if (!Number.isInteger(stats[field]) || stats[field] < 0) {
    throw new Error(`El reporte ${label} no contiene un contador válido para "${field}".`);
  }
  return stats[field];
}

function readMochaReport(report) {
  const parsed = readJson(report.file, report.name);
  if (!parsed) {
    return {
      name: report.name,
      file: report.file,
      status: 'missing',
      stats: null,
    };
  }

  if (!isRecord(parsed.value) || !isRecord(parsed.value.stats)) {
    throw new Error(`El reporte Mochawesome de ${report.name} no tiene el objeto "stats".`);
  }

  const sourceStats = parsed.value.stats;
  const stats = {
    tests: requireCount(sourceStats, 'tests', report.name),
    passes: requireCount(sourceStats, 'passes', report.name),
    failures: requireCount(sourceStats, 'failures', report.name),
    pending: requireCount(sourceStats, 'pending', report.name),
    skipped: requireCount(sourceStats, 'skipped', report.name),
  };

  return {
    name: report.name,
    file: report.file,
    status: 'available',
    stats,
    start: sourceStats.start || null,
    end: sourceStats.end || null,
    raw: parsed.raw,
  };
}

function readCoverage() {
  const parsed = readJson(OPTIONAL_REPORTS.coverage, 'cobertura');
  if (!parsed) return null;
  const total = parsed.value && parsed.value.total;
  if (!isRecord(total)) throw new Error('El reporte de cobertura no contiene "total".');

  for (const metric of ['lines', 'functions', 'branches']) {
    if (!isRecord(total[metric]) || typeof total[metric].pct !== 'number') {
      throw new Error(`El reporte de cobertura no contiene el porcentaje de ${metric}.`);
    }
  }

  return {
    lines: total.lines.pct,
    functions: total.functions.pct,
    branches: total.branches.pct,
    lineCount: total.lines.total,
    coveredLines: total.lines.covered,
    raw: parsed.raw,
  };
}

function readEslint() {
  const parsed = readJson(OPTIONAL_REPORTS.eslint, 'ESLint');
  if (!parsed) return null;
  if (!Array.isArray(parsed.value)) {
    throw new Error('El reporte ESLint debe ser una lista de resultados por archivo.');
  }

  const totals = parsed.value.reduce((result, fileResult) => {
    if (!isRecord(fileResult) ||
        !Number.isInteger(fileResult.errorCount) ||
        !Number.isInteger(fileResult.warningCount)) {
      throw new Error('El reporte ESLint contiene un resultado de archivo inválido.');
    }
    result.errors += fileResult.errorCount;
    result.warnings += fileResult.warningCount;
    return result;
  }, { errors: 0, warnings: 0 });

  return {
    files: parsed.value.length,
    errors: totals.errors,
    warnings: totals.warnings,
    raw: parsed.raw,
  };
}

function readK6(relativePath, label) {
  const parsed = readJson(relativePath, label);
  if (!parsed) return null;
  const result = parsed.value;
  if (!isRecord(result) || !isRecord(result.responseTimeMs)) {
    throw new Error(`El resumen k6 de ${label} no contiene las métricas esperadas.`);
  }

  for (const field of ['p95', 'average']) {
    if (typeof result.responseTimeMs[field] !== 'number') {
      throw new Error(`El resumen k6 de ${label} no tiene "${field}" válido.`);
    }
  }
  if (typeof result.httpErrorRate !== 'number' || typeof result.checkPassRate !== 'number') {
    throw new Error(`El resumen k6 de ${label} no tiene tasas válidas.`);
  }

  return {
    iterations: result.iterations,
    requestsPerSecond: result.requestsPerSecond,
    virtualUsers: result.virtualUsers || result.peakVirtualUsers || null,
    averageMs: result.responseTimeMs.average,
    p95Ms: result.responseTimeMs.p95,
    httpErrorRate: result.httpErrorRate,
    checkPassRate: result.checkPassRate,
    raw: parsed.raw,
  };
}

function collectResults() {
  const suites = MOCHA_REPORTS.map(readMochaReport);
  const availableSuites = suites.filter((suite) => suite.status === 'available');
  if (availableSuites.length === 0) {
    throw new Error('No hay reportes Mochawesome para consolidar. Ejecuta las suites primero.');
  }

  const totals = availableSuites.reduce((result, suite) => {
    for (const field of ['tests', 'passes', 'failures', 'pending', 'skipped']) {
      result[field] += suite.stats[field];
    }
    return result;
  }, { tests: 0, passes: 0, failures: 0, pending: 0, skipped: 0 });
  const executed = totals.passes + totals.failures;
  const passRate = executed ? Math.round((totals.passes / executed) * 10000) / 100 : null;

  const coverage = readCoverage();
  const eslint = readEslint();
  const performance = readK6(OPTIONAL_REPORTS.performance, 'carga');
  const stress = readK6(OPTIONAL_REPORTS.stress, 'estrés');

  const sourceHash = crypto.createHash('sha256');
  for (const source of [...suites, coverage, eslint, performance, stress]) {
    if (!source) {
      sourceHash.update('missing\n');
    } else if (source.raw) {
      sourceHash.update(source.raw);
      sourceHash.update('\n');
    } else {
      sourceHash.update(`${source.name}:${source.status}\n`);
    }
  }
  const missingSuites = suites.filter((suite) => suite.status === 'missing').map((suite) => suite.name);

  return {
    generatedAt: new Date().toISOString(),
    sourceRunKey: sourceHash.digest('hex'),
    status: missingSuites.length ? 'PARCIAL' : (totals.failures ? 'CON FALLOS' : 'APROBADO'),
    missingSuites,
    suites: suites.map(({ name, file, status, stats, start, end }) => ({
      name,
      file,
      status,
      stats,
      start,
      end,
    })),
    tests: {
      ...totals,
      executed,
      passRate,
    },
    coverage,
    eslint,
    performance,
    stress,
  };
}

function readHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  let history;
  try {
    history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch (error) {
    throw new Error(`No se pudo leer el historial de UniReport: ${error.message}`);
  }
  if (!Array.isArray(history) ||
      history.some((entry) => !isRecord(entry) || typeof entry.sourceRunKey !== 'string')) {
    throw new Error('El historial de UniReport debe ser una lista de ejecuciones con sourceRunKey.');
  }
  return history;
}

function updateHistory(result) {
  const history = readHistory();
  const snapshot = {
    generatedAt: result.generatedAt,
    sourceRunKey: result.sourceRunKey,
    status: result.status,
    tests: result.tests,
    coverage: result.coverage && {
      lines: result.coverage.lines,
      functions: result.coverage.functions,
      branches: result.coverage.branches,
    },
    eslint: result.eslint && {
      errors: result.eslint.errors,
      warnings: result.eslint.warnings,
    },
    performance: result.performance && {
      p95Ms: result.performance.p95Ms,
      httpErrorRate: result.performance.httpErrorRate,
    },
    stress: result.stress && {
      p95Ms: result.stress.p95Ms,
      httpErrorRate: result.stress.httpErrorRate,
    },
  };

  const existingIndex = history.findIndex((entry) => entry.sourceRunKey === result.sourceRunKey);
  if (existingIndex >= 0) {
    history[existingIndex] = snapshot;
  } else {
    history.push(snapshot);
  }

  const limitedHistory = history.slice(-MAX_HISTORY);
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(HISTORY_FILE, `${JSON.stringify(limitedHistory, null, 2)}\n`, 'utf8');
  return limitedHistory;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function formatNumber(value, digits = 2) {
  return typeof value === 'number' ? value.toFixed(digits) : 'N/D';
}

function formatRate(value) {
  return typeof value === 'number' ? `${formatNumber(value * 100)}%` : 'N/D';
}

function suiteRows(result) {
  return result.suites.map((suite) => {
    if (!suite.stats) {
      return `<tr><td>${escapeHtml(suite.name)}</td><td>Sin reporte</td><td colspan="5">${escapeHtml(suite.file)}</td></tr>`;
    }
    const status = suite.stats.failures ? 'CON FALLOS' : 'APROBADO';
    return `<tr>
      <td>${escapeHtml(suite.name)}</td>
      <td>${status}</td>
      <td>${suite.stats.tests}</td>
      <td>${suite.stats.passes}</td>
      <td>${suite.stats.failures}</td>
      <td>${suite.stats.pending}</td>
      <td>${suite.stats.skipped}</td>
      <td><code>${escapeHtml(suite.file)}</code></td>
    </tr>`;
  }).join('');
}

function optionalMetricRow(label, value, detail = '') {
  return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td><td>${escapeHtml(detail)}</td></tr>`;
}

function historyRows(history) {
  return history.slice().reverse().map((entry) => `
    <tr>
      <td>${escapeHtml(new Date(entry.generatedAt).toLocaleString('es'))}</td>
      <td>${escapeHtml(entry.status)}</td>
      <td>${entry.tests.passes}/${entry.tests.executed}</td>
      <td>${formatNumber(entry.tests.passRate)}%</td>
      <td>${entry.coverage ? `${formatNumber(entry.coverage.lines)}%` : 'N/D'}</td>
      <td>${entry.eslint ? entry.eslint.warnings : 'N/D'}</td>
      <td>${entry.performance ? `${formatNumber(entry.performance.p95Ms)} ms` : 'N/D'}</td>
      <td>${entry.stress ? `${formatNumber(entry.stress.p95Ms)} ms` : 'N/D'}</td>
    </tr>`).join('');
}

function generateHtml(result, history) {
  const coverage = result.coverage;
  const eslint = result.eslint;
  const performance = result.performance;
  const stress = result.stress;
  const trend = historyRows(history);
  const missingNote = result.missingSuites.length
    ? `Faltan reportes de: ${escapeHtml(result.missingSuites.join(', '))}.`
    : 'Se encontraron reportes para todas las suites configuradas.';
  const passRate = result.tests.passRate === null ? 'N/D' : `${formatNumber(result.tests.passRate)}%`;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>UniReport — Calidad y pruebas</title>
  <style>
    :root{font:16px system-ui,sans-serif;color:#172033;background:#f3f5f8}
    body{max-width:1180px;margin:32px auto;padding:0 20px}
    h1,h2{color:#19365b}
    .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin:20px 0}
    .card,section{background:#fff;border:1px solid #dfe4eb;border-radius:10px;padding:18px;box-shadow:0 2px 6px #0000000a}
    .value{font-size:1.8rem;font-weight:700;color:#176b50}
    .label,small{color:#5d6878}
    .status{font-weight:700}
    table{width:100%;border-collapse:collapse;background:#fff;margin:12px 0 24px}
    th,td{text-align:left;padding:10px;border-bottom:1px solid #e6e9ef;vertical-align:top}
    th{color:#33445c;background:#f7f8fa}
    code{font-size:.82rem;overflow-wrap:anywhere}
    .note{border-left:4px solid #e2a72e;padding:10px 14px;background:#fff8e7}
  </style>
</head>
<body>
  <h1>UniReport — Sistema de Gestión de Ventas</h1>
  <p>Consolidado de Mochawesome, cobertura c8, ESLint y resúmenes k6.</p>
  <p class="status">Estado: ${escapeHtml(result.status)} · Generado: ${escapeHtml(new Date(result.generatedAt).toLocaleString('es'))}</p>
  <div class="cards">
    <article class="card"><div class="value">${passRate}</div><div class="label">Pass rate de ejecuciones</div></article>
    <article class="card"><div class="value">${result.tests.passes}/${result.tests.executed}</div><div class="label">Aprobadas / ejecutadas</div></article>
    <article class="card"><div class="value">${result.tests.failures}</div><div class="label">Fallidas</div></article>
    <article class="card"><div class="value">${coverage ? `${formatNumber(coverage.lines)}%` : 'N/D'}</div><div class="label">Cobertura de líneas seleccionadas</div></article>
    <article class="card"><div class="value">${eslint ? eslint.warnings : 'N/D'}</div><div class="label">Advertencias ESLint</div></article>
  </div>
  <section>
    <h2>Resultados por suite</h2>
    <p>${missingNote}</p>
    <p>Total reportado: ${result.tests.tests} casos sumados entre suites. Las suites negativas se solapan; no representa requisitos únicos.</p>
    <table><thead><tr><th>Suite</th><th>Estado</th><th>Tests</th><th>Pass</th><th>Fail</th><th>Pending</th><th>Skipped</th><th>Fuente</th></tr></thead>
      <tbody>${suiteRows(result)}</tbody>
    </table>
  </section>
  <section>
    <h2>Métricas complementarias</h2>
    <table><tbody>
      ${optionalMetricRow('Cobertura de líneas', coverage ? `${formatNumber(coverage.lines)}%` : 'N/D', coverage ? `${coverage.coveredLines}/${coverage.lineCount}` : 'Reporte c8 no disponible')}
      ${optionalMetricRow('Cobertura de funciones', coverage ? `${formatNumber(coverage.functions)}%` : 'N/D')}
      ${optionalMetricRow('Cobertura de ramas', coverage ? `${formatNumber(coverage.branches)}%` : 'N/D')}
      ${optionalMetricRow('ESLint', eslint ? `${eslint.files} archivos; ${eslint.errors} errores; ${eslint.warnings} advertencias` : 'N/D', eslint ? 'Advertencias no equivalen a defectos confirmados' : 'Reporte ESLint no disponible')}
      ${optionalMetricRow('Carga k6', performance ? `${performance.iterations} iteraciones; p95 ${formatNumber(performance.p95Ms)} ms` : 'N/D', performance ? `${formatNumber(performance.requestsPerSecond)} req/s; errores HTTP ${formatRate(performance.httpErrorRate)}; checks ${formatRate(performance.checkPassRate)}` : 'Resumen k6 no disponible')}
      ${optionalMetricRow('Estrés k6', stress ? `${stress.iterations} iteraciones; p95 ${formatNumber(stress.p95Ms)} ms` : 'N/D', stress ? `${formatNumber(stress.requestsPerSecond)} req/s; errores HTTP ${formatRate(stress.httpErrorRate)}; checks ${formatRate(stress.checkPassRate)}` : 'Resumen k6 no disponible')}
    </tbody></table>
  </section>
  <section>
    <h2>Tendencia de reportes (máximo ${MAX_HISTORY} registros)</h2>
    <p>Se agrega una entrada cuando cambia el contenido de los reportes fuente. Volver a generar el dashboard sin nuevos resultados no duplica la misma corrida.</p>
    <table><thead><tr><th>Generado</th><th>Estado</th><th>Pass</th><th>Pass rate</th><th>Líneas</th><th>Warnings</th><th>Carga p95</th><th>Estrés p95</th></tr></thead>
      <tbody>${trend || '<tr><td colspan="8">Aún no hay historial de ejecuciones.</td></tr>'}</tbody>
    </table>
  </section>
  <p class="note">La estabilidad/flakiness es N/D: las suites Selenium/Mocha no registran reintentos como dato estructurado. El pass rate cuenta resultados reportados y puede incluir casos repetidos entre suites; no mide cobertura de requisitos ni defect leakage.</p>
</body>
</html>
`;
}

const result = collectResults();
fs.mkdirSync(REPORTS_DIR, { recursive: true });
const history = updateHistory(result);
fs.writeFileSync(OUTPUT_FILE, generateHtml(result, history), 'utf8');
console.log(`UniReport generado: ${OUTPUT_FILE}`);
console.log(
  `${result.status} | pass rate ${formatNumber(result.tests.passRate)}% | ` +
  `${result.tests.passes}/${result.tests.executed} aprobadas | historial ${history.length} registro(s)`,
);
