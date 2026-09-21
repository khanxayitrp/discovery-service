import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

export interface PresignedUploadResult {
    uploadUrl: string;
    objectKey: string;
    cdnUrl: string;
    expiresInSeconds: number;
    isSimulated: boolean;
}

export class StorageService {
    private s3Client: S3Client | null = null;
    private bucket: string;
    private cdnBaseUrl: string;
    private isConfigured: boolean = false;

    constructor() {
        this.bucket = process.env.S3_BUCKET || 'discovery-media';
        this.cdnBaseUrl = process.env.CDN_BASE_URL || 'https://cdn.discovery.local';

        const region = process.env.AWS_REGION || 'ap-southeast-1';
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        const endpoint = process.env.S3_ENDPOINT;

        if (accessKeyId && secretAccessKey) {
            this.s3Client = new S3Client({
                region,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
                ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
            });
            this.isConfigured = true;
            console.log('☁️ [StorageService] Configured with S3/MinIO provider');
        } else {
            console.log('🧪 [StorageService] S3 credentials not set — running in Local Mock Simulator mode');
        }
    }

    /**
     * Generate a presigned PUT URL for client-side direct upload
     */
    async createPresignedUploadUrl(
        objectKey: string,
        mimeType: string,
        expiresInSeconds: number = 900 // 15 minutes
    ): Promise<PresignedUploadResult> {
        const cdnUrl = `${this.cdnBaseUrl}/${objectKey}`;

        if (this.isConfigured && this.s3Client) {
            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: objectKey,
                ContentType: mimeType,
            });

            const uploadUrl = await getSignedUrl(this.s3Client, command, {
                expiresIn: expiresInSeconds,
            });

            return {
                uploadUrl,
                objectKey,
                cdnUrl,
                expiresInSeconds,
                isSimulated: false,
            };
        }

        // Local development simulator
        const port = process.env.PORT || 3002;
        const mockUploadUrl = `http://localhost:${port}/api/v1/discovery/media/mock-storage/${objectKey}`;

        return {
            uploadUrl: mockUploadUrl,
            objectKey,
            cdnUrl,
            expiresInSeconds,
            isSimulated: true,
        };
    }

    getCdnUrl(objectKey: string): string {
        return `${this.cdnBaseUrl}/${objectKey}`;
    }

    getStorageProvider(): string {
        return this.isConfigured ? 'S3' : 'LOCAL_MOCK';
    }
}

export const storageService = new StorageService();
