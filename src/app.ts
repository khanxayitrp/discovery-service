import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/data-source';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database Connection
AppDataSource.initialize()
    .then(() => {
        console.log('✅ Discovery Database connected successfully!');
    })
    .catch((err) => {
        console.error('❌ Error during Database initialization:', err);
    });

// API Gateway Identity Middleware
app.use((req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (userId) {
        // แปะ User ID เข้าไปใน Request เพื่อให้ Controller นำไปใช้ต่อ
        (req as any).user = { id: userId };
    }
    next();
});

// Health Check Route
app.get('/api/v1/discovery/health', (req, res) => {
    res.json({ status: 'ok', service: 'discovery-service' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`🚀 Discovery Service running on port ${PORT}`);
});