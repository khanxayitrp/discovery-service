import { Request, Response, NextFunction } from 'express';
import { placeService } from '../services/place.service';
import {
    NearbyQueryDto,
    SearchQueryDto,
    CreateMasterPlaceDto,
    UpdateMasterPlaceDto,
} from '../dto/place.dto';

export class PlaceController {
    /**
     * GET /places/nearby
     * Public search for places within a radius
     */
    async getNearby(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query as unknown as NearbyQueryDto;
            const result = await placeService.getNearbyPlaces(query);

            return res.status(200).json({
                status: 'success',
                data: result.items,
                meta: {
                    total: result.total,
                    page: query.page,
                    limit: query.limit,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /places/search
     * Public keyword, category, status & optional geo search
     */
    async search(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query as unknown as SearchQueryDto;
            const result = await placeService.searchPlaces(query);

            return res.status(200).json({
                status: 'success',
                data: result.items,
                meta: {
                    total: result.total,
                    page: query.page,
                    limit: query.limit,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /places/:idOrSlug
     * Public place detail with full relations (Locations, Hours, Categories, Amenities, Contacts)
     */
    async getDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const idOrSlug = req.params.idOrSlug as string;
            const place = await placeService.getPlaceDetail(idOrSlug);

            return res.status(200).json({
                status: 'success',
                data: place,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /admin/places
     * Master Data creation by Admin/System
     */
    async createMaster(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = req.body as CreateMasterPlaceDto;
            const creatorUserId = req.user?.id;

            const newPlace = await placeService.createMasterPlace(dto, creatorUserId);

            return res.status(201).json({
                status: 'success',
                message: 'Master Place created successfully',
                data: newPlace,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /admin/places/:id
     * Master Data update by Admin/System
     */
    async updateMaster(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const dto = req.body as UpdateMasterPlaceDto;
            const updaterUserId = req.user?.id;

            const updatedPlace = await placeService.updateMasterPlace(id, dto, updaterUserId);

            return res.status(200).json({
                status: 'success',
                message: 'Master Place updated successfully',
                data: updatedPlace,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const placeController = new PlaceController();