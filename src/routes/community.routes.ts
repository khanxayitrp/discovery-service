import { Router } from 'express';
import { communityController } from '../controllers/community.controller';

const router = Router();
router.post('/check-in', communityController.checkIn.bind(communityController));
router.post('/save', communityController.savePlace.bind(communityController));
export default router;