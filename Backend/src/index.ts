import { env } from './config/env';
import app from './app';

const PORT = env.PORT;

// Last-resort visibility. Task 1 wraps every handler in ah(), so a rejection
// reaching here means a route was added without it — log loudly, don't die silently.
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION — a route handler is likely missing ah():', reason);
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

app.listen(PORT, () => {
  console.log(`🪞 Christalin Mirrors API running on port ${PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});
