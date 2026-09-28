import type { NextFunction, Request, Response } from "express";

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
    const configuredApiKey  = process.env.PARKPAY_API_KEY;

    if (!configuredApiKey) {
        res.status(500).json({
            title: 'Internal Server Error',
            status: 500
        });
        return;
    }
    const providedApiKey = req.header('X-API-Key');

    if (!providedApiKey || providedApiKey !== configuredApiKey) {
        res.status(401).json({
            title: 'Unauthorized',
            status: 401
        });
        return;
    }
    next();
}