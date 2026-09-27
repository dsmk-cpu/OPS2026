import { describe, expect, it } from 'vitest';
import { CreatePaymentRequestSchema } from '../../src/presentation/schemas/CreatePaymentRequestSchema.js';

describe('CreatePaymentRequestSchema', () => {

    it('accepts a valid payment request', () => {
        const result = CreatePaymentRequestSchema.safeParse({
            id: 123,
            kennzeichen: 'DIL AB 123',
            betrag: '12.50',
        });

        expect(result.success).toBe(true);
    });

    it('rejects an invalid payment request', () => {
        const result = CreatePaymentRequestSchema.safeParse({
            id: -123,
            kennzeichen: '',
            betrag: 'abc',
        });

        expect(result.success).toBe(false);
    });

    it('rejects unknown properties', () => {
        const result = CreatePaymentRequestSchema.safeParse({
            id: 123,
            kennzeichen: 'DIL AB 123',
            betrag: '12.50',
            somethingElse: 'test',
        });

        expect(result.success).toBe(false);
    });
    
});