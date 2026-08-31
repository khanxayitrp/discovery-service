import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

// โหลดตัวแปรจากไฟล์ .env
dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    // ห้ามเปิด synchronize: true บน Production เด็ดขาด เพื่อป้องกันตารางพัง
    synchronize: false,
    logging: process.env.NODE_ENV !== 'production',
    // ชี้ไปที่โฟลเดอร์ entities ที่เราจัดระเบียบแล้ว
    entities: [__dirname + '/../entities/*.{ts,js}'],
    subscribers: [],
    migrations: [],
});