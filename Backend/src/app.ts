import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOptions } from './config/cors';
import routes from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';

const app = express();

// Behind Cloudflare — without this every request shares one IP and the rate
// limiters either do nothing or ban everyone at once.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));

app.use('/api', apiLimiter, routes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
