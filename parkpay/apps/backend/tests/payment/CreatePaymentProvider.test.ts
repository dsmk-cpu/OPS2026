import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { createPaymentProvider } from '../../src/infrastructure/payment/createPaymentProvider.js';
import { MockPaymentProvider } from '../../src/infrastructure/payment/MockPaymentProvider.js';


describe('createPaymentProvider', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('creates mock provider by default', () => {
        delete process.env.PAYMENT_PROVIDER;
        delete process.env.STRIPE_SECRET_KEY;

        const provider = createPaymentProvider();

        expect(provider).toBeInstanceOf(MockPaymentProvider);
    });

    it('throws when stripe is configured without secret key', () => {
        process.env.PAYMENT_PROVIDER = 'stripe';
        delete process.env.STRIPE_SECRET_KEY;

        expect(() => createPaymentProvider()).toThrow(
            'STRIPE_SECRET_KEY is required when PAYMENT_PROVIDER=stripe'
        );
    });

    it('throws for unsupported payment provider', () => {
        process.env.PAYMENT_PROVIDER = 'unknown';

        expect(() => createPaymentProvider()).toThrow(
            'Unsupported payment provider: unknown'
        );
    });
});