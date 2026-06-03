import cors from 'cors';
import { env } from './env';

export const corsOptions: cors.CorsOptions = {
  origin: [
    env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
