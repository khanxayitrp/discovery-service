import { Request, Response } from 'express';

export class CommunityController {
    async checkIn(req: Request, res: Response) {
        // TODO: Insert check-in record and invalidate relevant place cache
        res.status(201).json({ message: 'Check-in successful' });
    }

    async savePlace(req: Request, res: Response) {
        res.status(201).json({ message: 'Place saved' });
    }
}
export const communityController = new CommunityController();