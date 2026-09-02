import { Request, Response } from 'express';

export class CategoryController {
    async getAll(req: Request, res: Response) {
        // TODO: Implement GET from Redis Cache, fallback to DB
        res.status(200).json({ message: 'Get all categories' });
    }
}
export const categoryController = new CategoryController();