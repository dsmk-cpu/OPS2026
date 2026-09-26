import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Payment } from '../../src/domain/Payment.js';
import { Currency } from '../../src/domain/Currency.js';
import { PaymentStatus } from '../../src/domain/PaymentStatus.js';
import type { PaymentRepository } from '../../src/ports/PaymentRepository.js';
import {CreatePayment} from "../../src/application/services/CreatePayment.js";
import {PaymentConflictError} from "../../src/errors/PaymentConflictError.js";

function createRepositoryMock() {
    return {
        save: vi.fn<PaymentRepository['save']>(),

        findById: vi.fn<PaymentRepository['findById']>(),

        findByIdempotencyKey: vi.fn<PaymentRepository['findByIdempotencyKey']>(),

        findByParkingId: vi.fn<PaymentRepository['findByParkingId']>(),

        findByStatus: vi.fn<PaymentRepository['findByStatus']>(),
    };
}

describe('CreatePaymentService', () => {
    let repository: ReturnType<
        typeof createRepositoryMock
    >;

    let service: CreatePayment;

    beforeEach(() => {
        repository = createRepositoryMock();

        service = new CreatePayment(
            repository,
            () => 'payment1',
            () => new Date('2026-09-25T10:00:00.000Z'),
        );
    });

    it('creates and stores a pending payment', async () => {
        repository.findByParkingId.mockResolvedValue(null);
        repository.save.mockResolvedValue(undefined);

        const result = await service.execute({
            parkingId: 123,
            licensePlate: ' gi xy 123 ',
            amountInCents: 1250,
        });

        expect(result).toEqual({
            id: 'payment1',
            parkingId: 123,
            status: PaymentStatus.PENDING,
            created: true,
        });

        expect(repository.findByParkingId).toHaveBeenCalledWith(123);

        expect(repository.save).toHaveBeenCalledOnce();

        const savedPayment = repository.save.mock.calls[0]?.[0];

        expect(savedPayment?.id).toBe('payment1');
        expect(savedPayment?.parkingId).toBe(123);
        expect(savedPayment?.licensePlate).toBe('GI XY 123');
        expect(savedPayment?.amountInCents).toBe(1250);
        expect(savedPayment?.status).toBe(PaymentStatus.PENDING);
        expect(savedPayment?.idempotencyKey).toBe('parking:123');
    });

    it('returns an identical existing payment', async () => {
        const existingPayment = Payment.create({
            id: 'existing-payment',
            parkingId: 123,
            idempotencyKey: 'parking:123',
            licensePlate: 'GI XY 123',
            amountInCents: 1250,
            currency: Currency.EUR,
            now: new Date('2026-09-25T09:00:00.000Z'),
        });

        repository.findByParkingId.mockResolvedValue(
            existingPayment,
        );

        const result = await service.execute({
            parkingId: 123,
            licensePlate: ' gi xy 123 ',
            amountInCents: 1250,
        });

        expect(result).toEqual({
            id: 'existing-payment',
            parkingId: 123,
            status: PaymentStatus.PENDING,
            created: false,
        });

        expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejects different data for an existing parking id', async () => {
        const existingPayment = Payment.create({
            id: 'existing-payment',
            parkingId: 123,
            idempotencyKey: 'parking:123',
            licensePlate: 'GI XY 123',
            amountInCents: 1250,
            currency: Currency.EUR,
        });

        repository.findByParkingId.mockResolvedValue(existingPayment,);

        await expect(
            service.execute({
                parkingId: 123,
                licensePlate: 'GI XY 123',
                amountInCents: 2500,
            }),
        ).rejects.toBeInstanceOf(PaymentConflictError,);

        expect(repository.save).not.toHaveBeenCalled();
    });
});