import {describe, expect, it} from "vitest";
import {InvalidPaymentError, Payment} from "../../src/domain/Payment.js";
import {Currency} from "../../src/domain/Currency.js";
import {PaymentStatus} from "../../src/domain/PaymentStatus.js";

describe('Payment.create', () => {
    it('create pending payment with safe defaults', () => {
        const now = new Date('2026-09-25T16:00:00.000Z')

        const payment = Payment.create({
            id: '1',
            parkingId: 11,
            idempotencyKey: 'parking:11',
            licensePlate: 'dil abc12',
            amountInCents: 1250,
            currency: Currency.EUR,
            now
        });

        expect(payment.id).toBe('1');
        expect(payment.parkingId).toBe(11);
        expect(payment.idempotencyKey).toBe('parking:11');
        expect(payment.licensePlate).toBe('DIL ABC12');
        expect(payment.amountInCents).toBe(1250);
        expect(payment.currency).toBe(Currency.EUR);

        expect(payment.status).toBe(PaymentStatus.PENDING);
        expect(payment.paymentProviderReference).toBeNull();
        expect(payment.retryCount).toBe(0);
        expect(payment.nextRetryAt).toBeNull();
        expect(payment.lastAttemptAt).toBeNull();

        expect(payment.createdAt).toEqual(now);
        expect(payment.updatedAt).toEqual(now);
    });

    it('rejects a non-positive amount', () => {
        expect(() =>
            Payment.create({
                id: '1',
                parkingId: 11,
                idempotencyKey: 'parking:11',
                licensePlate: 'dil abc12',
                amountInCents: 0,
                currency: Currency.EUR,
            }),
        ).toThrow(InvalidPaymentError);
    });

    it('rejects invalid parking id', () => {
        expect(() =>
            Payment.create({
                id: '1',
                parkingId: 0,
                idempotencyKey: 'parking:0',
                licensePlate: 'dil abc12',
                amountInCents: 0,
                currency: Currency.EUR,
            }),
        ).toThrow(InvalidPaymentError);
    });

    it('rejects empty license plate', () => {
        expect(() =>
        Payment.create({
            id: '1',
            parkingId: 11,
            idempotencyKey: 'parking:11',
            licensePlate: '   ',
            amountInCents: 1250,
            currency: Currency.EUR,
        }),
        ).toThrow(InvalidPaymentError);
    });

    it('rejects license plate longer then 10 characters', () => {
        expect(() =>
            Payment.create({
                id: '1',
                parkingId: 11,
                idempotencyKey: 'parking:11',
                licensePlate: 'dil abc123333333',
                amountInCents: 1250,
                currency: Currency.EUR,
            }),
        ).toThrow(InvalidPaymentError);
    });
});