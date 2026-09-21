import { Request, Response, NextFunction } from 'express';
import { mediaService } from '../services/media.service';
import { RequestUploadUrlDto, ConfirmUploadDto } from '../dto/media.dto';

export class MediaController {
    /**
     * POST /media/upload-url
     * Request a presigned URL to upload directly to Object Storage
     */
    async requestUploadUrl(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const dto = req.body as RequestUploadUrlDto;

            const result = await mediaService.requestUploadUrl(userId, dto);

            return res.status(201).json({
                status: 'success',
                message: 'Presigned upload URL generated successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /media/:id/confirm
     * Confirm that the client finished uploading to S3
     */
    async confirmUpload(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const id = req.params.id as string;
            const dto = req.body as ConfirmUploadDto;

            const asset = await mediaService.confirmUpload(userId, id, dto);

            return res.status(200).json({
                status: 'success',
                message: 'Media upload confirmed successfully',
                data: asset,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /media/:id
     * Fetch media asset metadata
     */
    async getMedia(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const asset = await mediaService.getMediaAsset(id);

            return res.status(200).json({
                status: 'success',
                data: asset,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /media/mock-storage/*
     * Simulated S3 endpoint for local development/testing
     */
    async mockStorageReceiver(req: Request, res: Response) {
        return res.status(200).json({
            status: 'success',
            message: 'Mock upload acknowledged (Local Simulator)',
        });
    }
}

export const mediaController = new MediaController();
