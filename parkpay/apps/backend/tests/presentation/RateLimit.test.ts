import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { rateLimit } from 'express-rate-limit';

describe('parkpay rate limit', () => {
    it('returns 429 after the request limit is exceeded', async () => {
        const app = express();

        const limiter = rateLimit({
            windowMs: 60_000,
            limit: 2,
            standardHeaders: true,
            legacyHeaders: false,
        });

        app.get('/protected', limiter, (_req, res) => {
                res.status(200).json({
                    status: 'ok',
                });
            }
        );

        const firstResponse = await request(app).get('/protected');
        const secondResponse = await request(app).get('/protected');
        const thirdResponse = await request(app).get('/protected');

        expect(firstResponse.status).toBe(200);
        expect(secondResponse.status).toBe(200);
        expect(thirdResponse.status).toBe(429);
    });
});