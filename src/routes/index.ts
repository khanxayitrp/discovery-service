import { Router } from 'express';

import placeRouter from './place.routes';
import adminPlaceRouter from './admin-place.routes';
import categoryRouter from './category.routes';
import communityRouter from './community.routes';
import reviewRouter from './review.routes';
import partnerPlaceRouter from './partner-place.routes';
import mediaRouter from './media.routes';

const router = Router();

// 1. Discovery & Public Routes (อ่านอย่างเดียว เน้น Redis Cache)
router.use('/places', placeRouter);
router.use('/categories', categoryRouter);

// 2. Admin & Master Data Management Routes (ต้องมีสิทธิ์ ADMIN หรือ SYSTEM)
router.use('/admin/places', adminPlaceRouter);

// 3. Community & UGC Routes (สำหรับ User ที่ Login แล้ว)
router.use('/reviews', reviewRouter);
router.use('/community', communityRouter);
router.use('/media', mediaRouter);

// 4. Business Management Routes (สำหรับ Partner/Owner ต้องทำ Ownership Check)
router.use('/business/places', partnerPlaceRouter);

export default router;