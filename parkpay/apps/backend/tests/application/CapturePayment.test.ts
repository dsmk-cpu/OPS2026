import { describe, expect, it, vi } from "vitest";
import StripeConstructor from "stripe";
import {Currency} from "../../src/domain/Currency.js";
import {Payment} from "../../src/domain/Payment.js";
import {PaymentRepository} from "../../src/ports/PaymentRepository.js";
import {PaymentProvider, PaymentProviderStatus} from "../../src/ports/PaymentProvider.js";
import {CapturePayment} from "../../src/application/services/CapturePayment.js";
import {PaymentStatus} from "../../src/domain/PaymentStatus.js";
import {PaymentProviderConnectionError} from "../../src/errors/PaymentProviderConnectionError.js";
import {PaymentProviderError} from "../../src/errors/PaymentProviderError.js";


describe("CapturePayment", () => {
    const fixedNow = new Date("2026-09-29T12:00:00.000Z");

    function createPaidPayment(): Payment {
        const payment = Payment.create({
            id: "payment-1",
            parkingId: 123,
            idempotencyKey: "payment:payment-1",
            licensePlate: "DIL AB 1",
            amountInCents: 1250,
            currency: Currency.EUR,
            now: fixedNow
        });

        payment.markPaid("pi_test_123", fixedNow,);
        return payment;
    }

    function createRepository(payment: Payment | null): PaymentRepository {
        return {
            save: vi.fn(),
            findById: vi.fn().mockResolvedValue(payment),
            findByIdempotencyKey: vi.fn(),
            findByParkingId: vi.fn(),
            findByStatus: vi.fn(),
            findDue: vi.fn()
        };
    }

    function createProvider(): PaymentProvider {
        return {
            execute: vi.fn(),
            queryStatus: vi.fn(),
            capture: vi.fn()
        };
    }

    it("captures a paid payment successfully", async () => {
        const payment = createPaidPayment();
        const repository = createRepository(payment);
        const provider = createProvider();

        vi.mocked(provider.capture).mockResolvedValue({
            status: PaymentProviderStatus.CAPTURED,
            providerReference: "pi_test_123"
        });

        const useCase = new CapturePayment(
            repository,
            provider,
            () => fixedNow
        );

        await useCase.execute(payment.id);

        expect(provider.capture).toHaveBeenCalledWith({providerReference: "pi_test_123",});
        expect(payment.status).toBe(PaymentStatus.CAPTURED);
        expect(repository.save).toHaveBeenCalledWith(payment);
    });

    it("keeps payment paid and schedules retry when provider is offline", async () => {
        const payment = createPaidPayment();
        const repository = createRepository(payment);
        const provider = createProvider();

        vi.mocked(provider.capture).mockRejectedValue(new PaymentProviderConnectionError("Provider offline"));

        const useCase = new CapturePayment(repository, provider, () => fixedNow);

        await useCase.execute(payment.id);

        expect(payment.status).toBe(PaymentStatus.PAID);
        expect(payment.retryCount).toBe(1);
        expect(payment.nextRetryAt).toEqual(new Date(fixedNow.getTime() + 30_000));
        expect(repository.save).toHaveBeenCalledWith(payment);
    });

    it("captures successfully after a previous failed attempt", async () => {
        const payment = createPaidPayment();

        const firstRepository = createRepository(payment);
        const firstProvider = createProvider();

        vi.mocked(firstProvider.capture).mockRejectedValue(new PaymentProviderConnectionError("Provider offline"));

        const firstAttempt = new CapturePayment(firstRepository, firstProvider, () => fixedNow);

        await firstAttempt.execute(payment.id);

        expect(payment.status).toBe(PaymentStatus.PAID);
        expect(payment.retryCount).toBe(1);

        const retryTime = new Date(fixedNow.getTime() + 30_000);

        const secondRepository = createRepository(payment);
        const secondProvider = createProvider();

        vi.mocked(secondProvider.capture).mockResolvedValue({
            status: PaymentProviderStatus.CAPTURED,
            providerReference: "pi_test_123"
        });

        const secondAttempt = new CapturePayment(secondRepository, secondProvider, () => retryTime);

        await secondAttempt.execute(payment.id);

        expect(payment.status).toBe(PaymentStatus.CAPTURED);
        expect(secondProvider.capture).toHaveBeenCalledTimes(1);
        expect(secondRepository.save).toHaveBeenCalledWith(payment);
    });

    it("does nothing when payment does not exist", async () => {
        const repository = createRepository(null);
        const provider = createProvider();

        const useCase = new CapturePayment(repository, provider, () => fixedNow);

        await useCase.execute("unknown-payment");

        expect(provider.capture).not.toHaveBeenCalled();
        expect(repository.save).not.toHaveBeenCalled();
    });

    it("does nothing when payment is not paid", async () => {
        const payment = Payment.create({
            id: "payment-1",
            parkingId: 123,
            idempotencyKey: "payment:payment-1",
            licensePlate: "DIL AB 1",
            amountInCents: 1250,
            currency: Currency.EUR,
            now: fixedNow,
        });

        const repository = createRepository(payment);
        const provider = createProvider();

        const useCase = new CapturePayment(repository, provider, () => fixedNow);

        await useCase.execute(payment.id);

        expect(payment.status).toBe(PaymentStatus.PENDING);
        expect(provider.capture).not.toHaveBeenCalled();
        expect(repository.save).not.toHaveBeenCalled();
    });

    it("throws when paid payment has no provider reference", async () => {
        const payment = createPaidPayment();

        Object.defineProperty(
            payment,
            "paymentProviderReference",
            {
                get: () => null,
            },
        );

        const repository = createRepository(payment);
        const provider = createProvider();

        const useCase = new CapturePayment(repository, provider, () => fixedNow);

        await expect(useCase.execute(payment.id),).rejects.toBeInstanceOf(PaymentProviderError);
        expect(provider.capture).not.toHaveBeenCalled();
    });
});