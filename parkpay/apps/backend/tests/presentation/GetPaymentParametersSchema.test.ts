import { describe, expect, it } from 'vitest';

import { GetPaymentParameterSchema } from '../../src/presentation/schemas/GetPaymentParameterSchema.js';

describe('GetPaymentParamsSchema', () => {
    it('parses a valid parking id', () => {
        const result = GetPaymentParameterSchema.safeParse({
            id: '123',
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.id).toBe(123);
        }
    });

    it('rejects an invalid parking id', () => {
        const result = GetPaymentParameterSchema.safeParse({
            id: 'abc',
        });

        expect(result.success).toBe(false);
    });

    it('rejects a negative parking id', () => {
        const result = GetPaymentParameterSchema.safeParse({
            id: '-1',
        });

        expect(result.success).toBe(false);
    });
});