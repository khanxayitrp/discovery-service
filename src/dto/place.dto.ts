import { z } from 'zod';

// ==========================================
// 1. Master Place Creation Schema (Admin)
// ==========================================
export const createMasterPlaceSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    placeTypeId: z.string().uuid('Invalid placeTypeId UUID'),
    slug: z.string().max(300).optional(),
    description: z.string().optional(),
    status: z
        .enum([
            'CANDIDATE',
            'PENDING_REVIEW',
            'ACTIVE',
            'TEMPORARILY_CLOSED',
            'PERMANENTLY_CLOSED',
            'ARCHIVED',
        ])
        .default('ACTIVE'),
    verificationStatus: z
        .enum(['UNVERIFIED', 'VERIFIED', 'REJECTED'])
        .default('VERIFIED'),
    location: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        accuracyMeters: z.number().positive().optional(),
    }),
    categoryIds: z.array(z.string().uuid()).optional(),
    primaryCategoryId: z.string().uuid().optional(),
    amenityIds: z.array(z.string().uuid()).optional(),
    hours: z
        .array(
            z.object({
                dayOfWeek: z.number().int().min(0).max(6),
                openTime: z.string().nullable().optional(),
                closeTime: z.string().nullable().optional(),
                isClosed: z.boolean().default(false),
                is_24Hours: z.boolean().default(false),
            })
        )
        .optional(),
    contacts: z
        .array(
            z.object({
                contactType: z.string().max(30),
                contactValue: z.string().max(255),
                isPrimary: z.boolean().default(false),
            })
        )
        .optional(),
});

export type CreateMasterPlaceDto = z.infer<typeof createMasterPlaceSchema>;

// ==========================================
// 2. Master Place Update Schema (Admin)
// ==========================================
export const updateMasterPlaceSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    placeTypeId: z.string().uuid().optional(),
    slug: z.string().max(300).optional(),
    description: z.string().nullable().optional(),
    status: z
        .enum([
            'CANDIDATE',
            'PENDING_REVIEW',
            'ACTIVE',
            'TEMPORARILY_CLOSED',
            'PERMANENTLY_CLOSED',
            'ARCHIVED',
        ])
        .optional(),
    verificationStatus: z.enum(['UNVERIFIED', 'VERIFIED', 'REJECTED']).optional(),
    isActive: z.boolean().optional(),
    location: z
        .object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
            accuracyMeters: z.number().positive().optional(),
        })
        .optional(),
});

export type UpdateMasterPlaceDto = z.infer<typeof updateMasterPlaceSchema>;

// ==========================================
// 3. Nearby Query Schema (Public)
// ==========================================
export const nearbyQuerySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    radius: z.coerce.number().positive().max(50000).default(5000), // Max 50km
    categoryId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type NearbyQueryDto = z.infer<typeof nearbyQuerySchema>;

// ==========================================
// 4. Search Query Schema (Public)
// ==========================================
export const searchQuerySchema = z.object({
    q: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radius: z.coerce.number().positive().max(50000).optional(),
    status: z.string().default('ACTIVE'),
    sortBy: z.enum(['name', 'rating_average', 'created_at', 'distance']).default('created_at'),
    sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SearchQueryDto = z.infer<typeof searchQuerySchema>;

// ==========================================
// 5. Place ID or Slug Param Schema
// ==========================================
export const placeParamSchema = z.object({
    idOrSlug: z.string().min(1, 'Place identifier is required'),
});

export type PlaceParamDto = z.infer<typeof placeParamSchema>;
