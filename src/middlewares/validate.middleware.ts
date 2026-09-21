import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

interface RequestValidationSchema {
    body?: ZodSchema<any>;
    query?: ZodSchema<any>;
    params?: ZodSchema<any>;
}

export const validateRequest = (schemas: RequestValidationSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body);
            }
            if (schemas.query) {
                const parsedQuery = await schemas.query.parseAsync(req.query);
                Object.defineProperty(req, 'query', {
                    value: parsedQuery,
                    writable: true,
                    configurable: true,
                    enumerable: true,
                });
            }
            if (schemas.params) {
                const parsedParams = await schemas.params.parseAsync(req.params);
                Object.defineProperty(req, 'params', {
                    value: parsedParams,
                    writable: true,
                    configurable: true,
                    enumerable: true,
                });
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};
