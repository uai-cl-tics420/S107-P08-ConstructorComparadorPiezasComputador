import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Script for .env validation

const ENV_PATH = join(process.cwd(), '.env');
const EXAMPLE_PATH = join(process.cwd(), '.env.example');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

function parseEnv(path: string) {
  // Function to parse .env variables
  if (!existsSync(path)) return null; // If the file is missing, return null
  const content = readFileSync(path, 'utf-8');
  // Parse variables
  return content.split('\n').reduce((acc: any, line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      // If line is empty or a comment, skip
      return acc;
    }

    const [key = '', ...valueParts] = trimmedLine.split('=');
    const cleanKey = key.trim();

    if (cleanKey) {
      // Reconstruct values with '='
      let fullValue = valueParts.join('=').trim();

      // Discard inline comments
      const [valuePart = ''] = fullValue.split(' #');
      const [finalValue = ''] = valuePart.split('\t#');

      acc[cleanKey] = finalValue.trim();
    }

    return acc;
  }, {});
}

console.log('\nValidando Variables de Entorno...');

if (!existsSync(ENV_PATH)) {
  console.error(
    `[ERROR]${colors.reset}: El archivo .env no existe en la raíz. Por favor cree el archvio .env copiando .env.example (no borre, renombre o sobreescriba este último) y rellene los valores faltantes.\n`,
  );
  process.exit(1);
}
console.log(`${colors.green}[SUCCESS]${colors.reset} .env detectado.`);

const env = parseEnv(ENV_PATH);
const example = parseEnv(EXAMPLE_PATH);

if (!example) {
  console.error(
    `[ERROR]${colors.reset} No se encontró .env.example para comparar. Por favor, vuelva a agregarlo a la raíz del proyecto.\n`,
  );
  process.exit(1);
}

let hasError = false;

Object.keys(example).forEach((key) => {
  const value = env[key];

  if (value === undefined) {
    console.error(`[ERROR]${colors.reset} Falta la variable \"${key}\" en .env`);
    hasError = true;
  } else if (value === '') {
    console.error(`[ERROR]${colors.reset} La variable \"${key}\" está vacía en .env`);
    hasError = true;
  } else if (value.startsWith('<') && value.endsWith('>')) {
    console.warn(
      `${colors.yellow}[WARNING]${colors.reset} El valor en la variable \"${key}\" parece ser un placeholder, puede que algunas características dejen de funcionar`,
    );
  } else {
    console.log(`${colors.green}[SUCCESS]${colors.reset} La varaible \"${key}\" sí está configurada.`);
  }
});

if (hasError) {
  console.error(
    `\n[ERROR]${colors.reset} Fallo en la validación del archivo .env y sus variables. Por favor, resuelva los errorres listados arriba e intente nuevamente.\n`,
  );
  process.exit(1);
}

console.log(`\n${colors.green}[SUCCESS]${colors.reset} Validación Exitosa, continuando con la ejecución...\n`);
