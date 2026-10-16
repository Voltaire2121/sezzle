import { createApp } from './app';

try {
  process.loadEnvFile(); // optional .env (Node >= 21.7), see .env.example
} catch {
  // no .env file: fall back to defaults
}

const port = Number(process.env.PORT ?? 3001);

createApp().listen(port, () => {
  console.log(`Calculator API listening on http://localhost:${port}`);
});
