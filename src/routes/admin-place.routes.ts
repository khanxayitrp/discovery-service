import { Router } from 'express';
import { placeController } from '../controllers/place.controller';
import { ratingWorkerService } from '../services/rating-worker.service';
import { reconciliationService } from '../services/reconciliation.service';
import { requireRole } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
    createMasterPlaceSchema,
    updateMasterPlaceSchema,
} from '../dto/place.dto';

const router = Router();

// Enforce that only ADMIN or SYSTEM can access master place endpoints
router.use(requireRole(['ADMIN', 'SYSTEM']));

// Create Master Place
router.post(
    '/',
    validateRequest({ body: createMasterPlaceSchema }),
    (req, res, next) => placeController.createMaster(req, res, next)
);

// Trigger Outbox Processing (for manual test / on-demand trigger)
router.post('/process-outbox', async (req, res, next) => {
    try {
        const batchSize = parseInt(req.query.batchSize as string, 10) || 20;
        const results = await ratingWorkerService.processPendingEvents(batchSize);
        return res.status(200).json({
            status: 'success',
            message: `Processed ${results.length} outbox event(s)`,
            data: results,
        });
    } catch (error) {
        next(error);
    }
});

// Trigger Rating Reconciliation (Audit & repair drift)
router.post('/reconcile-ratings', async (req, res, next) => {
    try {
        const report = await reconciliationService.reconcileAllPlaces();
        return res.status(200).json({
            status: 'success',
            message: 'Rating reconciliation completed',
            data: report,
        });
    } catch (error) {
        next(error);
    }
});

// Update Master Place
router.patch(
    '/:id',
    validateRequest({ body: updateMasterPlaceSchema }),
    (req, res, next) => placeController.updateMaster(req, res, next)
);

export default router;
