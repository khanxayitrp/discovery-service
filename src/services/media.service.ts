import crypto from 'crypto';
import { AppDataSource } from '../config/data-source';
import { MediaAssets } from '../entities/MediaAssets';
import { storageService } from './storage.service';
import { RequestUploadUrlDto, ConfirmUploadDto } from '../dto/media.dto';
import { AppError } from '../utils/app-error';

export class MediaService {
    private mediaRepo = AppDataSource.getRepository(MediaAssets);

    /**
     * Step 1: Create media metadata with 'UPLOADING' status and generate a Presigned PUT URL
     */
    async requestUploadUrl(userId: string, dto: RequestUploadUrlDto) {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const cleanName = dto.fileName
            .toLowerCase()
            .replace(/[^a-z0-9.]+/g, '-')
            .replace(/^-+|-+$/g, '');
        const uniqueId = crypto.randomUUID();
        const objectKey = `uploads/${dto.purpose.toLowerCase()}/${year}/${month}/${uniqueId}-${cleanName}`;

        const mediaType = dto.mimeType.startsWith('image/') ? 'IMAGE' : 'VIDEO';
        const storageProvider = storageService.getStorageProvider();

        // 1. Save metadata record in DB1 (No binary stored)
        const newAsset = this.mediaRepo.create({
            mediaType,
            storageProvider,
            objectKey,
            mimeType: dto.mimeType,
            originalFilename: dto.fileName,
            fileSizeBytes: String(dto.fileSizeBytes),
            processingStatus: 'UPLOADING',
            moderationStatus: 'PENDING',
            createdBy: userId,
        });

        const savedAsset = await this.mediaRepo.save(newAsset);

        // 2. Generate Presigned URL
        const presigned = await storageService.createPresignedUploadUrl(
            objectKey,
            dto.mimeType,
            900 // 15 minutes
        );

        return {
            mediaAssetId: savedAsset.mediaAssetId,
            uploadUrl: presigned.uploadUrl,
            objectKey: presigned.objectKey,
            cdnUrl: presigned.cdnUrl,
            expiresInSeconds: presigned.expiresInSeconds,
            isSimulated: presigned.isSimulated,
        };
    }

    /**
     * Step 2: Confirm upload completion after client uploaded directly to S3/MinIO
     */
    async confirmUpload(userId: string, mediaAssetId: string, dto: ConfirmUploadDto) {
        const asset = await this.mediaRepo.findOne({ where: { mediaAssetId } });

        if (!asset) {
            throw AppError.notFound(`Media asset '${mediaAssetId}' not found`);
        }

        // Verify ownership (unless creator is null/system)
        if (asset.createdBy && asset.createdBy !== userId) {
            throw AppError.forbidden('Forbidden: You can only confirm your own media uploads');
        }

        // Idempotent: if already processed, return immediately
        if (asset.processingStatus === 'PROCESSED') {
            return asset;
        }

        // Update status to PROCESSED and set final CDN URL
        asset.processingStatus = 'PROCESSED';
        asset.cdnUrl = storageService.getCdnUrl(asset.objectKey);

        if (dto.width !== undefined) asset.width = dto.width;
        if (dto.height !== undefined) asset.height = dto.height;
        if (dto.durationSeconds !== undefined) asset.durationSeconds = String(dto.durationSeconds);

        return await this.mediaRepo.save(asset);
    }

    /**
     * Fetch media asset details by ID
     */
    async getMediaAsset(mediaAssetId: string) {
        const asset = await this.mediaRepo.findOne({ where: { mediaAssetId } });
        if (!asset) {
            throw AppError.notFound(`Media asset '${mediaAssetId}' not found`);
        }
        return asset;
    }
}

export const mediaService = new MediaService();
