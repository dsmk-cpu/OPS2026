import { describe, expect, it, vi } from 'vitest';
import { ProcessPayment } from '../../src/application/services/ProcessPayment.js';
import { ReconcilePayment } from '../../src/application/services/ReconcilePayment.js';
import {MockPaymentProvider, MockPaymentProviderMode } from '../../src/infrastructure/payment/MockPaymentProvider.js';
import type { PaymentRepository } from '../../src/ports/PaymentRepository.js';
import { Payment } from '../../src/domain/Payment.js';
import { PaymentStatus } from '../../src/domain/PaymentStatus.js';
import { Currency } from '../../src/domain/Currency.js';
import {PaymentNotFoundError} from "../../src/errors/PaymentNotFoundError.js";

function createRepositoryMock() {
    return {
        save: vi.fn<PaymentRepository['save']>(),
        findById: vi.fn<PaymentRepository['findById']>(),
        findByIdempotencyKey: vi.fn<PaymentRepository['findByIdempotencyKey']>(),
        findByParkingId: vi.fn<PaymentRepository['findByParkingId']>(),
        findByStatus: vi.fn<PaymentRepository['findByStatus']>(),
        findDue: vi.fn<PaymentRepository['findDue']>(),
    };
}

describe('ReconcilePayment', () => {
    it('marks payment as paid when provider processed it before connection was lost', async () => {
        const repository = createRepositoryMock();

        const payment = Payment.create({
            id: 'payment-1',
            parkingId: 123,
            idempotencyKey: 'parking:123',
            licensePlate: 'GI-AB-123',
            amountInCents: 1250,
            currency: Currency.EUR,
            now: new Date('2026-09-27T10:00:00.000Z'),
        });

        repository.findById.mockResolvedValue(payment);

        const provider = new MockPaymentProvider(MockPaymentProviderMode.TIMEOUT_AFTER_PROCESSING);
        const processPayment = new ProcessPayment(repository, provider, () => new Date('2026-09-27T10:05:00.000Z'));
        const reconcilePayment = new ReconcilePayment(repository, provider);

        await processPayment.execute('payment-1');

        expect(payment.status).toBe(PaymentStatus.PENDING);
        expect(payment.retryCount).toBe(1);

        await reconcilePayment.execute('payment-1');

        expect(payment.status).toBe(PaymentStatus.PAID);
        expect(payment.requiresReconciliation).toBe(false);
        expect(payment.paymentProviderReference).toBe('mock:payment-1');
        expect(payment.nextRetryAt).toBeNull();
        expect(repository.save).toHaveBeenCalledTimes(2);
    });

    it('schedules another status check when provider still returns PENDING', async () => {
        const repository = createRepositoryMock();

        const payment = Payment.create({
            id: 'payment-1',
            parkingId: 123,
            idempotencyKey: 'parking:123',
            licensePlate: 'GI-AB-123',
            amountInCents: 1250,
            currency: Currency.EUR,
            now: new Date('2026-09-27T10:00:00.000Z'),
        });

        repository.findById.mockResolvedValue(payment);

        const provider = new MockPaymentProvider(MockPaymentProviderMode.PENDING);
        const reconcilePayment = new ReconcilePayment(repository, provider, () => new Date('2026-09-27T10:05:00.000Z'));
        await reconcilePayment.execute('payment-1');

        expect(payment.status).toBe(PaymentStatus.PENDING);
        expect(payment.retryCount).toBe(0);
        expect(payment.lastAttemptAt).toEqual(new Date('2026-09-27T10:05:00.000Z'));
        expect(payment.nextRetryAt).toEqual(new Date('2026-09-27T10:05:30.000Z'));
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.save).toHaveBeenCalledWith(payment);
    });

    it('schedules a retry when provider is offline during reconciliation', async () => {
        const repository = createRepositoryMock();

        const payment = Payment.create({
            id: 'payment-1',
            parkingId: 123,
            idempotencyKey: 'parking:123',
            licensePlate: 'DIL-AB-123',
            amountInCents: 1250,
            currency: Currency.EUR,
            now: new Date('2026-09-27T10:00:00.000Z'),
        });

        repository.findById.mockResolvedValue(payment);

        const provider = new MockPaymentProvider(MockPaymentProviderMode.OFFLINE);

        const reconcilePayment = new ReconcilePayment(repository, provider, () => new Date('2026-09-27T10:05:00.000Z'));

        await reconcilePayment.execute('payment-1');

        expect(payment.status).toBe(PaymentStatus.PENDING);
        expect(payment.retryCount).toBe(1);
        expect(payment.requiresReconciliation).toBe(true);
        expect(payment.lastAttemptAt).toEqual(new Date('2026-09-27T10:05:00.000Z'));
        expect(payment.nextRetryAt).toEqual(new Date('2026-09-27T10:05:30.000Z'));
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.save).toHaveBeenCalledWith(payment);
    });

    it('throws PaymentNotFoundError when payment does not exist', async () => {
        const repository = createRepositoryMock();

        repository.findById.mockResolvedValue(null);

        const provider = new MockPaymentProvider(MockPaymentProviderMode.ONLINE_SUCCESS);
        const reconcilePayment = new ReconcilePayment(repository, provider);

        await expect(reconcilePayment.execute('unknown-payment')).rejects.toBeInstanceOf(PaymentNotFoundError);
        expect(repository.findById).toHaveBeenCalledWith('unknown-payment');
        expect(repository.save).not.toHaveBeenCalled();
    });
});