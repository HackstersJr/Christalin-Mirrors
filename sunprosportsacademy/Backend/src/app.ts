import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors';
import routes from './routes/index';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Global middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
