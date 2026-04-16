// Verify upon app start that all enviornment variables are configured

// Blank values by defaut for security reasons
const required = ['POSTGRES_PASSWORD', 'MONGO_PASSWORD', 'BETTER_AUTH_SECRET'];
const warning = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];

const missingRequisite = required.filter((v) => !process.env[v]);
const missingWarning = warning.filter((v) => !process.env[v]);

if (missingWarning.length > 0) {
  console.warn(
    `Warning: Missing enviornment variables:\n${missingWarning.join(', ')}\n\n` +
      `Some features may not work as expected. Copy .env.example to .env on the root directory and fill in the missing values to enable them.`,
  );
}

if (missingRequisite.length > 0) {
  console.error(
    `Missing enviornment variables:\n${missingRequisite.join(', ')}\n\n` +
      `Copy .env.example to .env on the root directory an fill in the missing values.`,
  );
  process.exit(1);
}
