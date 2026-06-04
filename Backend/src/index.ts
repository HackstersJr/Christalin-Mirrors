import { env } from './config/env';
import app from './app';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`🪞 Christalin Mirrors API running on port ${PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});
