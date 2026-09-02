import { Request, Response } from 'express';
import { placeService } from '../services/place.service';

export class PlaceController {
    async getNearby(req: Request, res: Response) {
        try {
            const lat = parseFloat(req.query.lat as string);
            const lng = parseFloat(req.query.lng as string);
            const radius = req.query.radius ? parseInt(req.query.radius as string) : 5000;

            if (isNaN(lat) || isNaN(lng)) {
                return res.status(400).json({ error: 'Valid latitude and longitude are required' });
            }

            const places = await placeService.getNearbyPlaces(lat, lng, radius);
            return res.status(200).json({ data: places });
        } catch (error: any) {
            console.error('Error in getNearby:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const { name, categoryId, lat, lng } = req.body;
            // ดึงข้อมูล User/Partner จากที่ Gateway ส่งมาใน Request (สมมติว่า Middleware ฝังไว้ใน req.user)
            const partnerId = (req as any).user?.id || 'SYSTEM'; // Ownership Data[cite: 2]

            if (!name || !categoryId || lat === undefined || lng === undefined) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const newPlace = await placeService.createPlace({ name, categoryId, lat, lng, partnerId });
            return res.status(201).json({ message: 'Place created successfully', data: newPlace });
        } catch (error: any) {
            console.error('Error in create place:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export const placeController = new PlaceController();