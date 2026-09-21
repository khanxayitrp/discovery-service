import { Router } from 'express';
import { mediaController } from '../controllers/media.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
    requestUploadUrlSchema,
    confirmUploadSchema,
    mediaParamSchema,
} from '../dto/media.dto';

const router = Router();

// Member: Request presigned upload URL
router.post(
    '/upload-url',
    requireAuth,
    validateRequest({ body: requestUploadUrlSchema }),
    (req, res, next) => mediaController.requestUploadUrl(req, res, next)
);

// Member: Confirm upload completion
router.post(
    '/:id/confirm',
    requireAuth,
    validateRequest({ params: mediaParamSchema, body: confirmUploadSchema }),
    (req, res, next) => mediaController.confirmUpload(req, res, next)
);

// Public/Member: Get media asset details
router.get(
    '/:id',
    validateRequest({ params: mediaParamSchema }),
    (req, res, next) => mediaController.getMedia(req, res, next)
);

// Local Mock Simulator storage receiver (bypasses S3 in dev)
router.put('/mock-storage/*key', (req, res) =>
    mediaController.mockStorageReceiver(req, res)
);

export default router;
