import { describe, expect, it, vi } from 'vitest';
import { ProcessPayment } from '../../src/application/services/ProcessPayment.js';
import { MockPaymentProvider, MockPaymentProviderMode } from '../../src/infrastructure/payment/MockPaymentProvider.js';
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

const logger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
} as any;

describe('ProcessPayment', () => {
    it('marks a pending payment as paid and saves it', async () => {
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

        const provider = new MockPaymentProvider(MockPaymentProviderMode.ONLINE_SUCCESS);

        const processPayment = new ProcessPayment(repository, provider, logger);

        await processPayment.execute('payment-1');

        expect(payment.status).toBe(PaymentStatus.PAID);
        expect(payment.paymentProviderReference).toBe('mock:payment-1');
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.findById).toHaveBeenCalledWith('payment-1');
        expect(repository.save).toHaveBeenCalledWith(payment);
    });

    it('throws PaymentNotFoundError when payment does not exist', async () => {
        const repository = createRepositoryMock();

        repository.findById.mockResolvedValue(null);

        const provider = new MockPaymentProvider(MockPaymentProviderMode.ONLINE_SUCCESS);

        const processPayment = new ProcessPayment(repository, provider, logger);

        await expect(processPayment.execute('missing-payment'))
            .rejects.toBeInstanceOf(PaymentNotFoundError);

        expect(repository.findById).toHaveBeenCalledWith('missing-payment');

        expect(repository.save).not.toHaveBeenCalled();
    });

    it('cancels payment when provider declines the payment', async () => {
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

        const provider = new MockPaymentProvider(
            MockPaymentProviderMode.DECLINED
        );

        const processPayment = new ProcessPayment(repository, provider, logger);

        await processPayment.execute('payment-1');

        expect(payment.status).toBe(PaymentStatus.CANCELED);
        expect(payment.paymentProviderReference).toBeNull();
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.save).toHaveBeenCalledWith(payment);
    });

    it('schedules a status check when provider returns PENDING', async () => {
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

        const provider = new MockPaymentProvider(
            MockPaymentProviderMode.PENDING
        );

        const processPayment = new ProcessPayment(repository, provider, logger, () => new Date('2026-09-27T10:05:00.000Z'));

        await processPayment.execute('payment-1');

        expect(payment.status).toBe(PaymentStatus.PENDING);
        expect(payment.retryCount).toBe(0);
        expect(payment.lastAttemptAt).toEqual(new Date('2026-09-27T10:05:00.000Z'));
        expect(payment.nextRetryAt).toEqual(new Date('2026-09-27T10:05:30.000Z'));
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.save).toHaveBeenCalledWith(payment);
    });

    it('schedules a retry when payment provider is offline', async () => {
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

        const processPayment = new ProcessPayment(repository, provider, logger, () => new Date('2026-09-27T10:05:00.000Z'));

        await processPayment.execute('payment-1');

        expect(payment.status).toBe(PaymentStatus.PENDING);
        expect(payment.retryCount).toBe(1);
        expect(payment.lastAttemptAt).toEqual(new Date('2026-09-27T10:05:00.000Z'));
        expect(payment.nextRetryAt).toEqual(new Date('2026-09-27T10:05:30.000Z'));
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.save).toHaveBeenCalledWith(payment);
    });

    it('uses exponential backoff for repeated connection errors', async () => {
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

        payment.registerFailedAttempts(new Date('2026-09-27T10:05:30.000Z'), new Date('2026-09-27T10:05:00.000Z'));

        expect(payment.retryCount).toBe(1);

        repository.findById.mockResolvedValue(payment);

        const provider = new MockPaymentProvider(MockPaymentProviderMode.OFFLINE);

        const processPayment = new ProcessPayment(repository, provider, logger, () => new Date('2026-09-27T10:10:00.000Z'));

        await processPayment.execute('payment-1');

        expect(payment.status).toBe(PaymentStatus.PENDING);
        expect(payment.retryCount).toBe(2);
        expect(payment.lastAttemptAt).toEqual(new Date('2026-09-27T10:10:00.000Z'));
        expect(payment.nextRetryAt).toEqual(new Date('2026-09-27T10:11:00.000Z'));
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.save).toHaveBeenCalledWith(payment);
    });

    it('caps retry delay at 30 minutes', async () => {
        const repository = createRepositoryMock();

        const payment = Payment.create({
            id: 'payment-1',
            parkingId: 123,
            idempotencyKey: 'parking:123',
            licensePlate: 'DIL-AB-12',
            amountInCents: 1250,
            currency: Currency.EUR,
            now: new Date('2026-09-28T10:00:00.000Z'),
        });

        for (let i = 0; i < 10; i++) {
            payment.registerFailedAttempts(
                new Date(`2026-09-28T10:${String(i + 1).padStart(2, '0')}:30.000Z`),
                new Date(`2026-09-28T10:${String(i + 1).padStart(2, '0')}:00.000Z`)
            );
        }

        repository.findById.mockResolvedValue(payment);

        const provider = new MockPaymentProvider(MockPaymentProviderMode.OFFLINE);

        const processPayment = new ProcessPayment(repository, provider, logger, () => new Date('2026-09-28T11:00:00.000Z'));

        await processPayment.execute('payment-1');
        expect(payment.nextRetryAt).toEqual(new Date('2026-09-28T11:30:00.000Z'));
    });
});