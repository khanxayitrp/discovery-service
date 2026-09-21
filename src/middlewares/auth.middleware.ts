import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

export interface UserContext {
    id: string;
    partnerId?: string;
    roles: string[];
}

declare global {
    namespace Express {
        interface Request {
            user?: UserContext;
        }
    }
}

export const authContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.headers['x-user-id'] as string) || '';
    const partnerId = (req.headers['x-partner-id'] as string) || undefined;
    const rawRoles = (req.headers['x-roles'] as string) || '';

    let roles: string[] = [];
    if (rawRoles) {
        try {
            if (rawRoles.startsWith('[')) {
                roles = JSON.parse(rawRoles);
            } else {
                roles = rawRoles.split(',').map((r) => r.trim().toUpperCase());
            }
        } catch {
            roles = rawRoles.split(',').map((r) => r.trim().toUpperCase());
        }
    }

    // Local development mock helper (allows convenient local curl/testing)
    if (!userId && process.env.NODE_ENV !== 'production' && req.headers['x-mock-user-id']) {
        const mockId = req.headers['x-mock-user-id'] as string;
        const mockRoles = ((req.headers['x-mock-roles'] as string) || 'COMMUNITY_MEMBER')
            .split(',')
            .map((r) => r.trim().toUpperCase());

        req.user = {
            id: mockId,
            partnerId: (req.headers['x-mock-partner-id'] as string) || undefined,
            roles: mockRoles,
        };
        return next();
    }

    if (userId) {
        req.user = {
            id: userId,
            partnerId,
            roles: roles.length > 0 ? roles : ['COMMUNITY_MEMBER'],
        };
    }

    next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
        return next(AppError.unauthorized('Authentication required: Missing user identity header'));
    }
    next();
};

export const requireRole = (allowedRoles: string[]) => {
    const upperAllowed = allowedRoles.map((r) => r.toUpperCase());

    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.id) {
            return next(AppError.unauthorized('Authentication required'));
        }

        const userRoles = req.user.roles.map((r) => r.toUpperCase());
        const hasPermission = userRoles.some((role) =>
            upperAllowed.includes(role) || role === 'ADMIN' || role === 'SYSTEM'
        );

        if (!hasPermission) {
            return next(
                AppError.forbidden(
                    `Forbidden: Requires one of [${allowedRoles.join(', ')}] role(s)`
                )
            );
        }

        next();
    };
};
