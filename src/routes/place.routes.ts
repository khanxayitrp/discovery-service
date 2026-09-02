import { Router } from 'express';
import { placeController } from '../controllers/place.controller';

const router = Router();

// ลำดับมีความสำคัญ: Route ที่เจาะจงต้องอยู่ก่อน Route ที่มี :id
router.get('/nearby', placeController.getNearby.bind(placeController));
router.post('/', placeController.create.bind(placeController));

export default router;