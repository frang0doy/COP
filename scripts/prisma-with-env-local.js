const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function parseDotEnv(contents) {
  const out = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Remove optional surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const contents = fs.readFileSync(filePath, 'utf8');
    return parseDotEnv(contents);
  } catch {
    return {};
  }
}

const projectRoot = path.resolve(__dirname, '..');
const envLocalPath = path.join(projectRoot, '.env.local');

// Solo cargamos `.env.local` para no interferir con Next (que también lee `.env`).
const fileEnv = { ...loadEnvFile(envLocalPath) };

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Uso: node scripts/prisma-with-env-local.js <prisma args...>');
  console.error('Ejemplo: node scripts/prisma-with-env-local.js db push');
  process.exit(1);
}

const childEnv = { ...process.env, ...fileEnv };

const result = spawnSync('npx', ['prisma', ...args], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: childEnv,
});

process.exit(result.status ?? 1);

