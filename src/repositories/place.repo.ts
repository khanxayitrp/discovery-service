import { AppDataSource } from '../config/data-source';
import { Places } from '../entities/Places';
import { NearbyQueryDto, SearchQueryDto } from '../dto/place.dto';

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface NearbyPlaceResult {
    place: Places;
    distanceMeters: number;
}

export class PlaceRepository {
    private repo = AppDataSource.getRepository(Places);

    /**
     * Find place by UUID (place_id) or by unique slug, including full relations
     */
    async findByIdOrSlug(idOrSlug: string): Promise<Places | null> {
        const isUuid = UUID_REGEX.test(idOrSlug);

        const qb = this.repo
            .createQueryBuilder('place')
            .leftJoinAndSelect('place.placeLocations', 'location')
            .leftJoinAndSelect('place.placeType', 'placeType')
            .leftJoinAndSelect('place.placeHours', 'hours')
            .leftJoinAndSelect('place.placeCategories', 'placeCategory')
            .leftJoinAndSelect('placeCategory.category', 'category')
            .leftJoinAndSelect('place.placeAmenities', 'placeAmenity')
            .leftJoinAndSelect('placeAmenity.amenity', 'amenity')
            .leftJoinAndSelect('place.placeContacts', 'contacts');

        if (isUuid) {
            qb.where('place.placeId = :id', { id: idOrSlug });
        } else {
            qb.where('place.slug = :slug', { slug: idOrSlug });
        }

        return await qb.getOne();
    }

    /**
     * Find nearby places using PostGIS ST_DWithin and calculate distance
     */
    async findNearby(
        query: NearbyQueryDto
    ): Promise<{ items: NearbyPlaceResult[]; total: number }> {
        const { lat, lng, radius, categoryId, page, limit } = query;
        const offset = (page - 1) * limit;

        const qb = this.repo
            .createQueryBuilder('place')
            .innerJoinAndSelect(
                'place.placeLocations',
                'location',
                'location.isPrimary = true'
            )
            .leftJoinAndSelect('place.placeType', 'placeType')
            .leftJoinAndSelect('place.placeCategories', 'placeCategory')
            .leftJoinAndSelect('placeCategory.category', 'category')
            .addSelect(
                'ST_Distance(location.geo_point, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)',
                'distance_meters'
            )
            .where('place.isActive = :isActive', { isActive: true })
            .andWhere('place.status = :status', { status: 'ACTIVE' })
            .andWhere(
                'ST_DWithin(location.geo_point, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)'
            )
            .setParameters({ lng, lat, radius });

        if (categoryId) {
            qb.andWhere('placeCategory.categoryId = :categoryId', { categoryId });
        }

        qb.orderBy('distance_meters', 'ASC')
            .skip(offset)
            .take(limit);

        const { entities, raw } = await qb.getRawAndEntities();

        const items: NearbyPlaceResult[] = entities.map((place, index) => ({
            place,
            distanceMeters: Math.round(Number(raw[index].distance_meters || 0)),
        }));

        const total = await qb.getCount();

        return { items, total };
    }

    /**
     * Flexible search for places with keyword, category, status, and geo filter
     */
    async searchPlaces(
        query: SearchQueryDto
    ): Promise<{ items: Places[]; total: number }> {
        const { q, categoryId, lat, lng, radius, status, sortBy, sortOrder, page, limit } =
            query;
        const offset = (page - 1) * limit;

        const qb = this.repo
            .createQueryBuilder('place')
            .leftJoinAndSelect('place.placeLocations', 'location')
            .leftJoinAndSelect('place.placeType', 'placeType')
            .leftJoinAndSelect('place.placeCategories', 'placeCategory')
            .leftJoinAndSelect('placeCategory.category', 'category')
            .where('place.isActive = :isActive', { isActive: true });

        if (status) {
            qb.andWhere('place.status = :status', { status });
        }

        if (q && q.trim()) {
            const searchTerm = `%${q.trim()}%`;
            qb.andWhere(
                '(place.name ILIKE :search OR place.description ILIKE :search OR place.slug ILIKE :search)',
                { search: searchTerm }
            );
        }

        if (categoryId) {
            qb.andWhere('placeCategory.categoryId = :categoryId', { categoryId });
        }

        if (lat !== undefined && lng !== undefined && radius !== undefined) {
            qb.andWhere(
                'location.isPrimary = true AND ST_DWithin(location.geo_point, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)',
                { lng, lat, radius }
            );
        }

        // Sorting
        if (sortBy === 'distance' && lat !== undefined && lng !== undefined) {
            qb.addSelect(
                'ST_Distance(location.geo_point, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)',
                'distance_meters'
            );
            qb.orderBy('distance_meters', sortOrder);
        } else if (sortBy === 'rating_average') {
            qb.orderBy('place.ratingAverage', sortOrder);
        } else if (sortBy === 'name') {
            qb.orderBy('place.name', sortOrder);
        } else {
            qb.orderBy('place.createdAt', sortOrder);
        }

        qb.skip(offset).take(limit);

        const [items, total] = await qb.getManyAndCount();
        return { items, total };
    }
}

export const placeRepository = new PlaceRepository();