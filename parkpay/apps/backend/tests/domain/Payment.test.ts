import {describe, expect, it} from "vitest";
import {Payment} from "../../src/domain/Payment.js";
import {InvalidPaymentError} from "../../src/errors/InvalidPaymentError.js";
import {Currency} from "../../src/domain/Currency.js";
import {PaymentStatus} from "../../src/domain/PaymentStatus.js";
import {InvalidPaymentTransitionError} from "../../src/errors/InvalidPaymentTransitionError.js";

function createPayment(): Payment {
    return Payment.create({
        id: '1',
        parkingId: 11,
        idempotencyKey: 'parking:11',
        licensePlate: 'dil abc12',
        amountInCents: 1250,
        currency: Currency.EUR,
        now: new Date('2026-09-25T16:00:00.000Z'),
    })
}


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


describe('Payment.markPaid', () => {

    it('marks pending as paid', () => {
        const payment = createPayment();
        const timestamp = new Date('2026-09-25T10:05:00.000Z');

        payment.markPaid('mockProviderReference1', timestamp);

        expect(payment.status).toBe(PaymentStatus.PAID);
        expect(payment.paymentProviderReference).toBe('mockProviderReference1');
        expect(payment.lastAttemptAt).toEqual(timestamp);
        expect(payment.nextRetryAt).toBeNull();
        expect(payment.updatedAt).toEqual(timestamp);
    });

    it('rejects empty payment provider reference', () => {
        const payment = createPayment();

        expect(() => {
            payment.markPaid('   ');
        }).toThrow(InvalidPaymentError);

        expect(payment.status).toBe(PaymentStatus.PENDING);
        expect(payment.paymentProviderReference).toBeNull();
    });

    it('rejects transition from paid to paid', () => {
        const payment = createPayment();

        payment.markPaid('mockProviderReference1');

        expect(() => {
            payment.markPaid('anotherMockProviderReference1');
        }).toThrow(InvalidPaymentTransitionError);

        expect(payment.status).toBe(PaymentStatus.PAID);
        expect(payment.paymentProviderReference).toBe('mockProviderReference1');
    });

    it('describes the rejected status transition', () => {
        const payment = createPayment();

        payment.markPaid('mockProviderReference1');

        let thrownError: unknown;

        try {
            payment.markPaid('anotherMockProviderReference1');
        } catch (error) {
            thrownError = error;
        }

        expect(thrownError).toBeInstanceOf(
            InvalidPaymentTransitionError,
        );

        expect(thrownError).toMatchObject({
            from: PaymentStatus.PAID,
            to: PaymentStatus.PAID,
        });
    });
});


describe('Payment.markCaptured', () => {

    it('mark paid to captured', () => {
        const payment = createPayment();
        const captureTimestamp = new Date('2026-09-25T10:10:00.000Z');

        payment.markPaid('mockProviderReference1', new Date('2026-09-25T10:05:00.000Z'));

        payment.markCaptured(captureTimestamp);

        expect(payment.status).toBe(PaymentStatus.CAPTURED);
        expect(payment.paymentProviderReference).toBe('mockProviderReference1');
        expect(payment.lastAttemptAt).toEqual(captureTimestamp);
        expect(payment.updatedAt).toEqual(captureTimestamp);
    });

    it('rejects capturing a pending payment', () => {
        const payment = createPayment();

        expect(() => {
            payment.markCaptured();
        }).toThrow(InvalidPaymentTransitionError);

        expect(payment.status).toBe(PaymentStatus.PENDING);
    });
});


describe('Payment.markCancelled', () => {

    it('mark pending to cancelled', () => {
        const payment = createPayment();
        const cancelledAt = new Date('2026-09-25T10:10:00.000Z');

        payment.markCancelled(cancelledAt);

        expect(payment.status).toBe(PaymentStatus.CANCELED);
        expect(payment.nextRetryAt).toBeNull();
        expect(payment.updatedAt).toEqual(cancelledAt);
    });

    it('rejects cancelling a paid payment', () => {
        const payment = createPayment();
        payment.markPaid('mockProviderReference1');

        expect(() => {
            payment.markCancelled();
        }).toThrow(InvalidPaymentTransitionError);

        expect(payment.status).toBe(PaymentStatus.PAID);
    });
});

describe('Payment.registerFailedAttempts', () => {

    it('registers a new retry after a failed attempt', () => {
        const payment = createPayment();

        const attemptedAt = new Date('2026-09-25T10:05:00.000Z');
        const nextRetryAt = new Date('2026-09-25T10:10:00.000Z');

        payment.registerFailedAttempts(nextRetryAt, attemptedAt);

        expect(payment.status).toBe(PaymentStatus.PENDING);

        expect(payment.retryCount).toBe(1);
        expect(payment.lastAttemptAt).toEqual(attemptedAt);
        expect(payment.nextRetryAt).toBe(nextRetryAt);
        expect(payment.updatedAt).toEqual(attemptedAt);
    });

    it('updates retry count on every failed attempt', () => {
        const payment = createPayment();


        payment.registerFailedAttempts(new Date('2026-09-25T10:10:00.000Z'), new Date('2026-09-25T10:05:00.000Z'));
        payment.registerFailedAttempts(new Date('2026-09-25T10:15:00.000Z'), new Date('2026-09-25T10:10:00.000Z'));

        expect(payment.retryCount).toBe(2);
    });

    it('rejects retry time that is earlier then the last attempt', () => {
        const payment = createPayment();

        expect(() => {
            payment.registerFailedAttempts(new Date('2026-09-25T10:05:00.000Z'), new Date('2026-09-25T10:10:00.000Z'));
        }).toThrow(InvalidPaymentError);

        expect(payment.retryCount).toBe(0);
        expect(payment.nextRetryAt).toBe(null);
    });

    it('rejects retries for an already paid payment', () => {
        const payment = createPayment();
        payment.markPaid('mockProviderReference1');

        expect(() => {
            payment.registerFailedAttempts(new Date('2026-09-25T10:10:00.000Z'), new Date('2026-09-25T10:05:00.000Z'));
        }).toThrow(InvalidPaymentError);

        expect(payment.retryCount).toBe(0);
        expect(payment.status).toBe(PaymentStatus.PAID);
    });
})