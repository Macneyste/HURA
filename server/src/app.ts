import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/security.js';
import { errorHandler, notFound } from './middleware/errors.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import roleRoutes from './routes/role.routes.js';
import auditRoutes from './routes/audit.routes.js';
import academicRoutes from './routes/academic.routes.js';
import {
  attendanceRouter,
  assessmentRouter,
  marksRouter,
  examRouter,
  resultsRouter,
  transcriptRouter,
  configRouter,
  publicVerifyRouter
} from './routes/phase3.routes.js';

export const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/v1/health', (_req, res) =>
  res.json({ success: true, message: 'HURU API is healthy', data: { status: 'ok', version: 'Phase 3' } })
);

// Public verification routes (no rate limit blocking or strict auth)
app.use('/verify', publicVerifyRouter);
app.use('/api/v1/verify', publicVerifyRouter);

app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1', academicRoutes);

// Phase 3 Academic & Results Routes
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/assessments', assessmentRouter);
app.use('/api/v1/assessment-results', marksRouter);
app.use('/api/v1/exams', examRouter);
app.use('/api/v1/results', resultsRouter);
app.use('/api/v1/transcripts', transcriptRouter);
app.use('/api/v1', configRouter);

app.use(notFound);
app.use(errorHandler);
