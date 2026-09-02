import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

class RedisService {
    private client: RedisClientType;
    private isConnected: boolean = false;

    constructor() {
        // ใช้ REDIS_URL เป็นหลัก ถ้าไม่มีให้ Fallback กลับไปใช้ localhost
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        this.client = createClient({
            url: redisUrl
        });

        this.client.on('error', (err: Error) => {
            console.error('❌ Redis Client Error:', err);
        });

        this.client.on('connect', () => {
            console.log('✅ Connected to Redis');
            this.isConnected = true;
        });

        this.client.on('disconnect', () => {
            console.log('⚠️ Disconnected from Redis');
            this.isConnected = false;
        });
    }

    async connect(): Promise<void> {
        try {
            if (!this.isConnected) {
                await this.client.connect();
            }
        } catch (error: unknown) {
            const err = error as Error;
            console.error('❌ Failed to connect to Redis:', err.message);
            throw err;
        }
    }

    async disconnect(): Promise<void> {
        try {
            if (this.isConnected) {
                await this.client.disconnect();
            }
        } catch (error: unknown) {
            const err = error as Error;
            console.error('Failed to disconnect from Redis:', err.message);
            throw err;
        }
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<string | null> {
        try {
            if (ttlSeconds) {
                return await this.client.setEx(key, ttlSeconds, value);
            } else {
                return await this.client.set(key, value);
            }
        } catch (error: unknown) {
            console.error('Failed to set Redis key:', (error as Error).message);
            throw error;
        }
    }

    async get(key: string): Promise<string | null> {
        try {
            return await this.client.get(key);
        } catch (error: unknown) {
            console.error('Failed to get Redis key:', (error as Error).message);
            throw error;
        }
    }

    // ลบ Cache ตาม Pattern (สำคัญมากสำหรับการทำ Cache Invalidation)
    async delByPattern(pattern: string): Promise<number> {
        if (!this.isConnected) {
            console.warn('Redis client is not connected. Skipping delByPattern.');
            return 0;
        }

        try {
            let deletedCount = 0;
            let cursor = '0';

            do {
                const result = await this.client.scan(cursor, {
                    MATCH: pattern,
                    COUNT: 100,
                });

                cursor = result.cursor;
                const keys = result.keys;

                if (Array.isArray(keys) && keys.length > 0) {
                    // แปลงเป็น array ชัดเจน และ spread ได้อย่างปลอดภัย
                    // const mutableKeys = keys.slice(); // หรือใช้ keys.slice()
                    const deleted = await this.client.del(keys);
                    deletedCount += deleted;
                    console.log(`Deleted ${deleted} keys matching pattern: ${pattern}`);
                }
            } while (cursor !== '0');

            return deletedCount;
        } catch (error: unknown) {
            const err = error as Error;
            console.error('Failed to delete Redis keys by pattern:', err.message);
            throw err;
        }
    }
}

export const redisService = new RedisService();