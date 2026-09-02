import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/data-source';
import { redisService } from './services/redis.service';

// Import ตัว Master Router ที่เรารวมไว้
import discoveryRoutes from './routes';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database & Redis
Promise.all([
    AppDataSource.initialize(),
    redisService.connect()
])
    .then(() => console.log('✅ Database and Redis initialized'))
    .catch(err => console.error('❌ Initialization Error:', err));

// ตัวอย่าง Identity Middleware (ดึง User/Partner ID จาก Gateway)
app.use((req, res, next) => {
    const userId = req.headers['x-user-id'];
    const partnerId = req.headers['x-partner-id'];
    (req as any).user = { id: userId, partnerId: partnerId };
    next();
});

// --- MAIN ROUTING REGISTRATION ---
// ผูก Master Router เข้ากับ Base Path ของ Microservice นี้
app.use('/api/v1/discovery', discoveryRoutes);

// Health Check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`🚀 Discovery Service running on port ${PORT}`);
});