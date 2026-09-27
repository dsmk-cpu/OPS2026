import {describe, expect, it} from "vitest";
import {toCreatePaymentCommand} from "../../src/presentation/mappers/CreatePaymentRequestMapper.js";

describe('CreatePaymentRequestMapper', () => {

    it('maps request dto to CreatePaymentCommand', () => {
        const res = toCreatePaymentCommand({
            id: 123,
            kennzeichen: 'DIL AB 123',
            betrag: '12.50'
        });

        expect(res).toEqual({
            parkingId: 123,
            licensePlate: 'DIL AB 123',
            amountInCents: 1250
        });
    });

    it('converts amounts correctly', () => {
        const res = toCreatePaymentCommand({
            id: 123,
            kennzeichen: 'DIL AB 123',
            betrag: '0.05'
        });

        expect(res.amountInCents).toBe(5);
    })
})