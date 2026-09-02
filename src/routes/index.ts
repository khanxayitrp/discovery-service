import { Router } from 'express';

// Import All Routers (สมมติว่าคุณสร้างไฟล์เหล่านี้ไว้แล้ว)
import placeRouter from './place.routes';
import categoryRouter from './category.routes';
import communityRouter from './community.routes';
import reviewRouter from './review.routes';
import partnerPlaceRouter from './partner-place.routes';

const router = Router();

// Interface สำหรับกำหนด Type ของ Route
interface IRoute {
    path: string;
    route: Router;
}

// 1. Discovery & Public Routes (อ่านอย่างเดียว เน้น Redis Cache[cite: 2])
const publicRoutes: IRoute[] = [
    { path: '/categories', route: categoryRouter },
    { path: '/places', route: placeRouter },
];

// 2. Community & UGC Routes (สำหรับ User ทั่วไปที่ Login แล้ว)
const communityRoutes: IRoute[] = [
    { path: '/reviews', route: reviewRouter },
    { path: '/community', route: communityRouter }, // เช่น check-ins, saved-places
];

// 3. Business Management Routes (สำหรับ Partner/Owner ต้องทำ Ownership Check[cite: 2])
const businessRoutes: IRoute[] = [
    { path: '/business/places', route: partnerPlaceRouter }, // สำหรับจัดการ Claim หรืออัปเดตข้อมูลร้าน
];

// --- Register Routes ---

// ลงทะเบียน Public Routes
publicRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

// (ตัวอย่าง) หากมี Middleware ตรวจสอบ Auth สามารถนำมาดักหน้ากลุ่ม Protected ได้
// router.use(requireAuthMiddleware);

// ลงทะเบียน Community Routes
communityRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

// ลงทะเบียน Business Routes
businessRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

export default router;