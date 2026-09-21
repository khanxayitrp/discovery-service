import { z } from 'zod';

export const requestUploadUrlSchema = z.object({
    fileName: z.string().min(1, 'fileName is required').max(255),
    fileSizeBytes: z
        .number()
        .positive('fileSizeBytes must be positive')
        .max(50 * 1024 * 1024, 'Maximum allowed file size is 50MB'),
    mimeType: z.enum([
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/quicktime',
        'video/webm',
    ]),
    purpose: z
        .enum(['REVIEW', 'PLACE_COVER', 'PLACE_GALLERY', 'AVATAR'])
        .default('REVIEW'),
});

export type RequestUploadUrlDto = z.infer<typeof requestUploadUrlSchema>;

export const confirmUploadSchema = z.object({
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    durationSeconds: z.number().positive().optional(),
});

export type ConfirmUploadDto = z.infer<typeof confirmUploadSchema>;

export const mediaParamSchema = z.object({
    id: z.string().uuid('Invalid media ID UUID'),
});

export type MediaParamDto = z.infer<typeof mediaParamSchema>;
