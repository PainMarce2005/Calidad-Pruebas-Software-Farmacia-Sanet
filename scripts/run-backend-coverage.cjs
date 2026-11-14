const { spawnSync } = require('node:child_process');

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.error('No se encontró npm_execpath para ejecutar las suites de cobertura.');
  process.exitCode = 1;
} else {
  const suites = ['test:unit', 'test:api', 'test:negative', 'test:negative-all'];

  for (const suite of suites) {
    const result = spawnSync(
      process.execPath,
      [npmCli, 'run', suite],
      { env: process.env, stdio: 'inherit' }
    );

    if (result.error) {
      console.error(`No se pudo ejecutar ${suite}:`, result.error.message);
      process.exitCode = 1;
      break;
    }

    if (result.status !== 0) {
      process.exitCode = result.status ?? 1;
      break;
    }
  }
}
