import express from 'express';
import request from 'supertest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '../../src/errors/ErrorHandler.js';
import { logger } from '../../src/infrastructure/logging/logger.js';
import {RequestValidationError} from "../../src/errors/RequestValidationError.js";
import {PaymentNotFoundError} from "../../src/errors/PaymentNotFoundError.js";
import {PaymentConflictError} from "../../src/errors/PaymentConflictError.js";


function createTestApp(error: Error) {
    const app = express();

    app.use((
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        req.id = 'test-request-id';
        req.log = logger.child({
            reqId: req.id,
        });

        res.setHeader(
            'X-Request-Id',
            req.id
        );

        next();
    });

    app.get('/test', async () => {
        throw error;
    });

    app.use(errorHandler);

    return app;
}

describe('ErrorHandler', () => {
    it('returns 400 for RequestValidationError', async () => {
        const schema = z.object({
            id: z.number(),
        });

        const result = schema.safeParse({
            id: 'invalid',
        });

        if (result.success) {
            throw new Error('Expected validation to fail');
        }

        const app = createTestApp(
            new RequestValidationError(
                result.error.issues
            )
        );

        const response = await request(app)
            .get('/test');

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            title: 'Invalid request',
            status: 400,
            traceId: 'test-request-id',
        });

        expect(
            response.headers['x-request-id']
        ).toBe('test-request-id');
    });

    it('returns 404 for PaymentNotFoundError', async () => {
        const app = createTestApp(
            new PaymentNotFoundError(123)
        );

        const response = await request(app)
            .get('/test');

        expect(response.status).toBe(404);

        expect(response.body).toEqual({
            title: 'Payment not found',
            status: 404,
            traceId: 'test-request-id',
        });
    });

    it('returns 409 for PaymentConflictError', async () => {
        const app = createTestApp(
            new PaymentConflictError(123)
        );

        const response = await request(app)
            .get('/test');

        expect(response.status).toBe(409);

        expect(response.body).toEqual({
            title: 'Payment conflict',
            status: 409,
            traceId: 'test-request-id',
        });
    });

    it('returns 500 without exposing internal error details', async () => {
        const app = createTestApp(
            new Error(
                'Sensitive internal database information'
            )
        );

        const response = await request(app)
            .get('/test');

        expect(response.status).toBe(500);

        expect(response.body).toEqual({
            title: 'Internal server error',
            status: 500,
            traceId: 'test-request-id',
        });

        expect(response.body).not.toHaveProperty(
            'stack'
        );

        expect(
            JSON.stringify(response.body)
        ).not.toContain(
            'Sensitive internal database information'
        );
    });
});