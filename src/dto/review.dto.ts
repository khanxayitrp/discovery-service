import { z } from 'zod';

// ==========================================
// 1. Query Reviews for a Place Schema (Public)
// ==========================================
export const getPlaceReviewsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z
        .enum(['newest', 'highest_rating', 'lowest_rating'])
        .default('newest'),
});

export type GetPlaceReviewsQueryDto = z.infer<typeof getPlaceReviewsQuerySchema>;

// ==========================================
// 2. Query Media for a Place Schema (Public)
// ==========================================
export const getPlaceMediaQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GetPlaceMediaQueryDto = z.infer<typeof getPlaceMediaQuerySchema>;

// ==========================================
// 3. Create / Update Review Schema (Member)
// ==========================================
export const createReviewSchema = z.object({
    rating: z
        .number()
        .min(1.0, 'Rating must be between 1.0 and 5.0')
        .max(5.0, 'Rating must be between 1.0 and 5.0'),
    title: z.string().max(255).optional().nullable(),
    content: z.string().max(2000).optional().nullable(),
    mediaAssetIds: z.array(z.string().uuid()).max(10, 'Maximum 10 media assets allowed').optional(),
});

export type CreateReviewDto = z.infer<typeof createReviewSchema>;

// ==========================================
// 4. Parameter Schemas
// ==========================================
export const placeIdParamSchema = z.object({
    placeId: z.string().uuid('Invalid placeId UUID'),
});

export type PlaceIdParamDto = z.infer<typeof placeIdParamSchema>;

export const reviewIdParamSchema = z.object({
    reviewId: z.string().uuid('Invalid reviewId UUID'),
});

export type ReviewIdParamDto = z.infer<typeof reviewIdParamSchema>;
