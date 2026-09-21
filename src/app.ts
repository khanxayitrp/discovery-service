import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/data-source';
import { redisService } from './services/redis.service';
import discoveryRoutes from './routes';
import { authContextMiddleware } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { AppError } from './utils/app-error';

import { ratingWorkerService } from './services/rating-worker.service';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database & Redis
Promise.all([
    AppDataSource.initialize(),
    redisService.connect()
])
    .then(() => {
        console.log('✅ Database and Redis initialized');
        ratingWorkerService.startWorker(5000);
    })
    .catch(err => console.error('❌ Initialization Error:', err));

// Global Auth Context Middleware (Gateway Headers + Local Mock)
app.use(authContextMiddleware);

// Health Check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Main Routing Registration
app.use('/api/v1/discovery', discoveryRoutes);

// 404 Not Found Handler for Unmatched Routes
app.use((req, res, next) => {
    next(AppError.notFound(`Cannot find ${req.method} ${req.originalUrl} on this service`));
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`🚀 Discovery Service running on port ${PORT}`);
});

export default app;