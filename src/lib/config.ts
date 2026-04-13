// Verify upon app start that all enviornment variables are configured

const required = ['POSTGRES_PASSWORD', 'MONGO_PASSWORD', 'BETTER_AUTH_SECRET']; // Blank values by defaut for security reasons
const missing = required.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.error(
    `Missing enviornment variables:\n${missing.join(', ')}\n\n` +
      `Copy .env.example to .env on the root directory an fill in the missing values.`,
  );
  process.exit(1);
}
