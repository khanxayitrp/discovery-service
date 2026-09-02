import { Router } from 'express';
import { partnerPlaceController } from '../controllers/partner-place.controller';

const router = Router();
router.put('/:placeId', partnerPlaceController.updatePlaceDetails.bind(partnerPlaceController));
export default router;