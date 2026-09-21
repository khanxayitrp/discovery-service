import { AppDataSource } from '../config/data-source';
import { placeRepository } from '../repositories/place.repo';
import { redisService } from './redis.service';
import { outboxService } from './outbox.service';
import { Places } from '../entities/Places';
import { PlaceLocations } from '../entities/PlaceLocations';
import { PlaceHours } from '../entities/PlaceHours';
import { PlaceCategories } from '../entities/PlaceCategories';
import { PlaceAmenities } from '../entities/PlaceAmenities';
import { PlaceContacts } from '../entities/PlaceContacts';
import {
    CreateMasterPlaceDto,
    NearbyQueryDto,
    SearchQueryDto,
    UpdateMasterPlaceDto,
} from '../dto/place.dto';
import { AppError } from '../utils/app-error';

export class PlaceService {
    /**
     * Get place detail with full relations, using Redis cache
     */
    async getPlaceDetail(idOrSlug: string): Promise<Places> {
        const cacheKey = `place:detail:${idOrSlug}`;
        const cached = await redisService.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        const place = await placeRepository.findByIdOrSlug(idOrSlug);
        if (!place) {
            throw AppError.notFound(`Place '${idOrSlug}' not found`);
        }

        // Cache by requested key for 10 minutes (600s)
        await redisService.set(cacheKey, JSON.stringify(place), 600);

        // Also cache cross-reference (if queried by slug, cache ID, and vice versa)
        if (place.slug && idOrSlug !== place.slug) {
            await redisService.set(`place:detail:${place.slug}`, JSON.stringify(place), 600);
        }
        if (place.placeId && idOrSlug !== place.placeId) {
            await redisService.set(`place:detail:${place.placeId}`, JSON.stringify(place), 600);
        }

        return place;
    }

    /**
     * Get nearby places with coordinate rounding for caching
     */
    async getNearbyPlaces(query: NearbyQueryDto) {
        const roundedLat = query.lat.toFixed(4);
        const roundedLng = query.lng.toFixed(4);
        const catKey = query.categoryId || 'all';
        const cacheKey = `places:nearby:${roundedLat}:${roundedLng}:${query.radius}:${catKey}:${query.page}:${query.limit}`;

        const cached = await redisService.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const result = await placeRepository.findNearby(query);

        // Cache nearby results for 5 minutes
        if (result.items.length > 0) {
            await redisService.set(cacheKey, JSON.stringify(result), 300);
        }

        return result;
    }

    /**
     * Search places with keyword, category, status, and geo filter
     */
    async searchPlaces(query: SearchQueryDto) {
        return await placeRepository.searchPlaces(query);
    }

    /**
     * Create Master Place (Admin/System master data only).
     * Executes in a transaction: Places + Location + Categories + Amenities + Hours + Contacts + Outbox Event.
     */
    async createMasterPlace(dto: CreateMasterPlaceDto, creatorUserId?: string): Promise<Places> {
        return await AppDataSource.transaction(async (manager) => {
            const placeRepo = manager.getRepository(Places);

            // 1. Generate unique slug if not supplied
            let finalSlug = dto.slug;
            if (!finalSlug) {
                const cleanName = dto.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                finalSlug = `${cleanName}-${Date.now().toString(36)}`;
            }

            // Check slug uniqueness
            const existingSlug = await placeRepo.findOne({ where: { slug: finalSlug } });
            if (existingSlug) {
                finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;
            }

            // 2. Save Place master record
            const newPlace = placeRepo.create({
                name: dto.name,
                placeTypeId: dto.placeTypeId,
                slug: finalSlug,
                description: dto.description || null,
                status: dto.status,
                verificationStatus: dto.verificationStatus,
                isActive: true,
                createdBy: creatorUserId || null,
            });

            const savedPlace = await placeRepo.save(newPlace);

            // 3. Save Primary Location (PostGIS)
            const locRepo = manager.getRepository(PlaceLocations);
            const newLocation = locRepo.create({
                placeId: savedPlace.placeId,
                locationType: 'PRIMARY',
                latitude: dto.location.latitude,
                longitude: dto.location.longitude,
                accuracyMeters: dto.location.accuracyMeters || null,
                geoPoint: {
                    type: 'Point',
                    coordinates: [dto.location.longitude, dto.location.latitude],
                } as any,
                isPrimary: true,
                verificationStatus: 'VERIFIED',
                source: 'ADMIN',
            });
            await locRepo.save(newLocation);

            // 4. Save Place Categories if provided
            if (dto.categoryIds && dto.categoryIds.length > 0) {
                const catRepo = manager.getRepository(PlaceCategories);
                for (const catId of dto.categoryIds) {
                    const placeCat = catRepo.create({
                        placeId: savedPlace.placeId,
                        categoryId: catId,
                        isPrimary: catId === dto.primaryCategoryId,
                    });
                    await catRepo.save(placeCat);
                }
            }

            // 5. Save Place Amenities if provided
            if (dto.amenityIds && dto.amenityIds.length > 0) {
                const amenityRepo = manager.getRepository(PlaceAmenities);
                for (const amId of dto.amenityIds) {
                    const placeAmenity = amenityRepo.create({
                        placeId: savedPlace.placeId,
                        amenityId: amId,
                    });
                    await amenityRepo.save(placeAmenity);
                }
            }

            // 6. Save Place Hours if provided
            if (dto.hours && dto.hours.length > 0) {
                const hoursRepo = manager.getRepository(PlaceHours);
                for (const hr of dto.hours) {
                    const placeHour = hoursRepo.create({
                        placeId: savedPlace.placeId,
                        dayOfWeek: hr.dayOfWeek,
                        openTime: hr.openTime || null,
                        closeTime: hr.closeTime || null,
                        isClosed: hr.isClosed,
                        is_24Hours: hr.is_24Hours,
                    });
                    await hoursRepo.save(placeHour);
                }
            }

            // 7. Save Place Contacts if provided
            if (dto.contacts && dto.contacts.length > 0) {
                const contactRepo = manager.getRepository(PlaceContacts);
                for (const ct of dto.contacts) {
                    const placeContact = contactRepo.create({
                        placeId: savedPlace.placeId,
                        contactType: ct.contactType,
                        contactValue: ct.contactValue,
                        isPrimary: ct.isPrimary,
                        isVerified: true,
                    });
                    await contactRepo.save(placeContact);
                }
            }

            // 8. Atomically Record Outbox Event for Search Projection / Event Bus
            await outboxService.recordEvent(manager, {
                aggregateType: 'PLACE',
                aggregateId: savedPlace.placeId,
                eventType: 'PlaceCreated',
                payload: {
                    placeId: savedPlace.placeId,
                    name: savedPlace.name,
                    slug: savedPlace.slug,
                    status: savedPlace.status,
                    placeTypeId: savedPlace.placeTypeId,
                    latitude: dto.location.latitude,
                    longitude: dto.location.longitude,
                    createdAt: savedPlace.createdAt,
                },
            });

            // 9. Clear relevant caches
            await this.clearPlaceCache(savedPlace.placeId, savedPlace.slug);

            return savedPlace;
        });
    }

    /**
     * Update Master Place details and status (Admin/System only)
     */
    async updateMasterPlace(
        placeId: string,
        dto: UpdateMasterPlaceDto,
        updaterUserId?: string
    ): Promise<Places> {
        return await AppDataSource.transaction(async (manager) => {
            const placeRepo = manager.getRepository(Places);
            const existingPlace = await placeRepo.findOne({ where: { placeId } });

            if (!existingPlace) {
                throw AppError.notFound(`Place with ID '${placeId}' not found`);
            }

            const oldStatus = existingPlace.status;

            // Update place master fields
            if (dto.name !== undefined) existingPlace.name = dto.name;
            if (dto.placeTypeId !== undefined) existingPlace.placeTypeId = dto.placeTypeId;
            if (dto.slug !== undefined) existingPlace.slug = dto.slug;
            if (dto.description !== undefined) existingPlace.description = dto.description;
            if (dto.status !== undefined) existingPlace.status = dto.status;
            if (dto.verificationStatus !== undefined) existingPlace.verificationStatus = dto.verificationStatus;
            if (dto.isActive !== undefined) existingPlace.isActive = dto.isActive;

            const updatedPlace = await placeRepo.save(existingPlace);

            // Update Location if provided
            if (dto.location) {
                const locRepo = manager.getRepository(PlaceLocations);
                let location = await locRepo.findOne({ where: { placeId, isPrimary: true } });

                if (location) {
                    location.latitude = dto.location.latitude;
                    location.longitude = dto.location.longitude;
                    location.geoPoint = {
                        type: 'Point',
                        coordinates: [dto.location.longitude, dto.location.latitude],
                    } as any;
                    if (dto.location.accuracyMeters !== undefined) {
                        location.accuracyMeters = dto.location.accuracyMeters;
                    }
                    await locRepo.save(location);
                } else {
                    const newLocation = locRepo.create({
                        placeId,
                        latitude: dto.location.latitude,
                        longitude: dto.location.longitude,
                        geoPoint: {
                            type: 'Point',
                            coordinates: [dto.location.longitude, dto.location.latitude],
                        } as any,
                        isPrimary: true,
                    });
                    await locRepo.save(newLocation);
                }
            }

            // Determine event type
            const eventType =
                oldStatus !== updatedPlace.status ? 'PlaceStatusChanged' : 'PlaceUpdated';

            // Atomically Record Outbox Event
            await outboxService.recordEvent(manager, {
                aggregateType: 'PLACE',
                aggregateId: updatedPlace.placeId,
                eventType,
                payload: {
                    placeId: updatedPlace.placeId,
                    name: updatedPlace.name,
                    slug: updatedPlace.slug,
                    status: updatedPlace.status,
                    isActive: updatedPlace.isActive,
                    updatedBy: updaterUserId || null,
                    updatedAt: updatedPlace.updatedAt,
                },
            });

            // Invalidate caches
            await this.clearPlaceCache(updatedPlace.placeId, updatedPlace.slug);

            return updatedPlace;
        });
    }

    /**
     * Invalidate caches associated with places
     */
    async clearPlaceCache(placeId?: string, slug?: string) {
        if (placeId) {
            await redisService.del(`place:detail:${placeId}`);
        }
        if (slug) {
            await redisService.del(`place:detail:${slug}`);
        }
        await redisService.delByPattern('places:nearby:*');
    }
}

export const placeService = new PlaceService();