import express from 'express';
import request from 'supertest';
import helmet from 'helmet';
import { describe, expect, it } from 'vitest';

describe('security headers', () => {
    it('adds security headers', async () => {
        const app = express();

        app.use(helmet());

        app.get('/health', (_req, res) => {
            res.status(200).json({
                status: 'ok',
            });
        });

        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.headers).toHaveProperty('x-content-type-options');
        expect(response.headers).toHaveProperty('x-frame-options');
        expect(response.headers).toHaveProperty('content-security-policy');
    });
});