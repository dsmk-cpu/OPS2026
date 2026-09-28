import express from 'express';
import request from 'supertest';
import {afterEach, describe, expect, it} from 'vitest';
import { apiKeyAuth } from '../../src/presentation/middleware/apiKeyAuth.js';

describe('apiKeyAuth', () => {
    const originalApiKey =
        process.env.PARKPAY_API_KEY;

    afterEach(() => {
        if (originalApiKey === undefined) {
            delete process.env.PARKPAY_API_KEY;
        } else {
            process.env.PARKPAY_API_KEY = originalApiKey;
        }
    });

    it('returns 500 when no API key is configured', async () => {
        delete process.env.PARKPAY_API_KEY;

        const app = express();

        app.get('/protected', apiKeyAuth, (_req, res) => {
                res.status(200).json({
                    status: 'ok',
                });
            }
        );

        const response = await request(app)
            .get('/protected');

        expect(response.status).toBe(500);
    });

    it('returns 401 when API key is missing', async () => {
        process.env.PARKPAY_API_KEY =
            'test-secret';

        const app = express();

        app.get('/protected', apiKeyAuth, (_req, res) => {
                res.status(200).json({
                    status: 'ok',
                });
            }
        );

        const response = await request(app).get('/protected');

        expect(response.status).toBe(401);
    });

    it('returns 401 when API key is wrong', async () => {
        process.env.PARKPAY_API_KEY =
            'test-secret';

        const app = express();

        app.get('/protected', apiKeyAuth, (_req, res) => {
                res.status(200).json({
                    status: 'ok',
                });
            }
        );

        const response = await request(app)
            .get('/protected')
            .set('X-API-Key', 'wrong-secret');

        expect(response.status).toBe(401);
    });

    it('allows request when API key is correct', async () => {
        process.env.PARKPAY_API_KEY =
            'test-secret';

        const app = express();

        app.get('/protected', apiKeyAuth, (_req, res) => {
                res.status(200).json({
                    status: 'ok',
                });
            }
        );

        const response = await request(app)
            .get('/protected')
            .set('X-API-Key', 'test-secret');

        expect(response.status).toBe(200);

        expect(response.body).toEqual({status: 'ok'});
    });
});