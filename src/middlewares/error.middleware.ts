import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error';

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // 1. Zod Validation Errors
    if (err instanceof ZodError) {
        const formattedErrors = err.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
        }));

        return res.status(400).json({
            status: 'fail',
            error: 'Validation Error',
            details: formattedErrors,
        });
    }

    // 2. Custom App Operational Errors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.statusCode >= 500 ? 'error' : 'fail',
            error: err.message,
            ...(err.details ? { details: err.details } : {}),
        });
    }

    // 3. Express JSON Parse Error
    if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
        return res.status(400).json({
            status: 'fail',
            error: 'Malformed JSON payload in request body',
        });
    }

    // 4. Unexpected / Unknown Server Errors
    console.error('💥 Unhandled Exception:', err);
    return res.status(500).json({
        status: 'error',
        error: 'Internal Server Error',
    });
};
