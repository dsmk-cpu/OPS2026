import {beforeEach, describe, expect, it, vi} from "vitest";
import type {PaymentRepository} from "../../src/ports/PaymentRepository.js";
import {GetPayment} from "../../src/application/services/GetPayment.js";
import {Payment} from "../../src/domain/Payment.js";
import {Currency} from "../../src/domain/Currency.js";
import {PaymentStatus} from "../../src/domain/PaymentStatus.js";
import {PaymentNotFoundError} from "../../src/errors/PaymentNotFoundError.js";

function createRepositoryMock() {
    return {
        save: vi.fn<PaymentRepository['save']>(),

        findById: vi.fn<PaymentRepository['findById']>(),

        findByIdempotencyKey: vi.fn<PaymentRepository['findByIdempotencyKey']>(),

        findByParkingId: vi.fn<PaymentRepository['findByParkingId']>(),

        findByStatus: vi.fn<PaymentRepository['findByStatus']>(),
    };
}

describe('GetPaymentService', () => {
    let repository: ReturnType<typeof createRepositoryMock>;
    let service: GetPayment;

    beforeEach(() => {
        repository = createRepositoryMock();
        service = new GetPayment(repository);
    });

    it('returns an existing payment', async () => {
        const existing = Payment.create({
            id: 'payment1',
            parkingId: 123,
            idempotencyKey: 'parking:123',
            licensePlate: 'DIL AB 123',
            amountInCents: 1250,
            currency: Currency.EUR
        });

        repository.findByParkingId.mockResolvedValue(existing);

        const res = await service.execute(123);

        expect(res).toEqual({
            id: 'payment1',
            parkingId: 123,
            status: PaymentStatus.PENDING,
        });

        expect(repository.findByParkingId).toHaveBeenCalledWith(123);
    });

    it('throws when payment does not exist.', async () => {
        repository.findByParkingId.mockResolvedValue(null);

        await expect(service.execute(1))
            .rejects.toBeInstanceOf(PaymentNotFoundError);

        expect(repository.findByParkingId).toHaveBeenCalledWith(1);
    });
});