import {PaymentRepository} from "../../src/ports/PaymentRepository.js";
import {describe, expect, it, vi} from "vitest";
import {Payment} from "../../src/domain/Payment.js";
import {Currency} from "../../src/domain/Currency.js";
import {ProcessPayment} from "../../src/application/services/ProcessPayment.js";
import {ReconcilePayment} from "../../src/application/services/ReconcilePayment.js";
import {PaymentWorker} from "../../src/application/services/PaymentWorker.js";
import {Logger} from "pino";

function createRepositoryMock() {
    return {
        save: vi.fn<PaymentRepository['save']>(),
        findById: vi.fn<PaymentRepository['findById']>(),
        findByIdempotencyKey: vi.fn<PaymentRepository['findByIdempotencyKey']>(),
        findByParkingId: vi.fn<PaymentRepository['findByParkingId']>(),
        findByStatus: vi.fn<PaymentRepository['findByStatus']>(),
        findPendingDue: vi.fn<PaymentRepository['findPendingDue']>(),
    };
}

const logger = {
    error: vi.fn(),
} as unknown as Logger;

describe('PaymentWorker', () => {
    it('processes a new pending payment', async () => {
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

        repository.findPendingDue.mockResolvedValue([payment]);

        const processPayment = {
            execute: vi.fn(),
        } as unknown as ProcessPayment;

        const reconcilePayment = {
            execute: vi.fn(),
        } as unknown as ReconcilePayment;

        const worker = new PaymentWorker(
            repository,
            processPayment,
            reconcilePayment,
            logger,
            () => new Date('2026-09-28T10:05:00.000Z')

        );

        await worker.runOnce();

        expect(repository.findPendingDue).toHaveBeenCalledWith(new Date('2026-09-28T10:05:00.000Z'));
        expect(processPayment.execute).toHaveBeenCalledWith('payment-1');
        expect(reconcilePayment.execute).not.toHaveBeenCalled();
    });

    it('reconciles a pending payment that was already attempted', async () => {
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

        payment.markForReconciliation(
            new Date('2026-09-28T10:05:30.000Z'),
            new Date('2026-09-28T10:05:00.000Z')
        );

        repository.findPendingDue.mockResolvedValue([payment]);

        const processPayment = {
            execute: vi.fn(),
        } as unknown as ProcessPayment;

        const reconcilePayment = {
            execute: vi.fn(),
        } as unknown as ReconcilePayment;

        const worker = new PaymentWorker(
            repository,
            processPayment,
            reconcilePayment,
            logger,
            () => new Date('2026-09-28T10:06:00.000Z')
        );

        await worker.runOnce();

        expect(reconcilePayment.execute).toHaveBeenCalledWith('payment-1');
        expect(processPayment.execute).not.toHaveBeenCalled();
    });

    it('continues processing when one payment fails', async () => {
        const repository = createRepositoryMock();

        const firstPayment = Payment.create({
            id: 'payment-1',
            parkingId: 123,
            idempotencyKey: 'parking:123',
            licensePlate: 'DIL-AB-123',
            amountInCents: 1250,
            currency: Currency.EUR,
            now: new Date('2026-09-28T10:00:00.000Z'),
        });

        const secondPayment = Payment.create({
            id: 'payment-2',
            parkingId: 124,
            idempotencyKey: 'parking:124',
            licensePlate: 'DIL-AB-124',
            amountInCents: 1500,
            currency: Currency.EUR,
            now: new Date('2026-09-28T10:00:00.000Z'),
        });

        repository.findPendingDue.mockResolvedValue([
            firstPayment,
            secondPayment,
        ]);

        const processPayment = {
            execute: vi.fn()
                .mockRejectedValueOnce(new Error('Provider error'))
                .mockResolvedValueOnce(undefined),
        } as unknown as ProcessPayment;

        const reconcilePayment = {
            execute: vi.fn(),
        } as unknown as ReconcilePayment;

        const worker = new PaymentWorker(
            repository,
            processPayment,
            reconcilePayment,
            logger,
            () => new Date('2026-09-28T10:05:00.000Z')
        );

        await worker.runOnce();

        expect(processPayment.execute).toHaveBeenCalledTimes(2);
        expect(processPayment.execute).toHaveBeenNthCalledWith(1, 'payment-1');
        expect(processPayment.execute).toHaveBeenNthCalledWith(2, 'payment-2');
        expect(logger.error).toHaveBeenCalledOnce();
    });

    it('processes payment again after a connection failure', async () => {
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

        payment.registerFailedAttempts(
            new Date('2026-09-28T10:05:30.000Z'),
            new Date('2026-09-28T10:05:00.000Z')
        );

        repository.findPendingDue.mockResolvedValue([payment]);

        const processPayment = {
            execute: vi.fn(),
        } as unknown as ProcessPayment;

        const reconcilePayment = {
            execute: vi.fn(),
        } as unknown as ReconcilePayment;

        const worker = new PaymentWorker(
            repository,
            processPayment,
            reconcilePayment,
            logger,
            () => new Date('2026-09-28T10:06:00.000Z')
        );

        await worker.runOnce();

        expect(payment.requiresReconciliation).toBe(false);
        expect(processPayment.execute).toHaveBeenCalledWith('payment-1');
        expect(reconcilePayment.execute).not.toHaveBeenCalled();
    });
});
