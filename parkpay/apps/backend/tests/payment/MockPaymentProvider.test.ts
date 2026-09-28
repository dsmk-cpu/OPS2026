import { describe, expect, it } from 'vitest';
import { MockPaymentProvider, MockPaymentProviderMode } from '../../src/infrastructure/payment/MockPaymentProvider.js';
import { PaymentProviderStatus, type ExecutePaymentRequest } from '../../src/ports/PaymentProvider.js';
import { PaymentProviderConnectionError } from '../../src/errors/PaymentProviderConnectionError.js';
import { PaymentProviderError } from '../../src/errors/PaymentProviderError.js';
import {PaymentProviderUncertainOutcomeError} from "../../src/errors/PaymentProviderUncertainOutcomeError.js";

const request: ExecutePaymentRequest = {
    paymentId: 'payment-1',
    amountInCents: 1250,
    currency: 'EUR',
    idempotencyKey: 'parking:123',
};

describe('MockPaymentProvider', () => {
    it('returns PAID for ONLINE_SUCCESS', async () => {
        const provider = new MockPaymentProvider(
            MockPaymentProviderMode.ONLINE_SUCCESS
        );

        const result = await provider.execute(request);

        expect(result).toEqual({
            status: PaymentProviderStatus.PAID,
            providerReference: 'mock:payment-1',
        });
    });

    it('returns DECLINED for DECLINED', async () => {
        const provider = new MockPaymentProvider(
            MockPaymentProviderMode.DECLINED
        );

        const result = await provider.execute(request);

        expect(result).toEqual({
            status: PaymentProviderStatus.DECLINED,
        });
    });

    it('returns PENDING for PENDING', async () => {
        const provider = new MockPaymentProvider(
            MockPaymentProviderMode.PENDING
        );

        const result = await provider.execute(request);

        expect(result).toEqual({
            status: PaymentProviderStatus.PENDING,
        });
    });

    it('throws connectivity error for OFFLINE', async () => {
        const provider = new MockPaymentProvider(
            MockPaymentProviderMode.OFFLINE
        );

        await expect(
            provider.execute(request)
        ).rejects.toBeInstanceOf(
            PaymentProviderConnectionError
        );
    });

    it('throws connectivity error for TIMEOUT_AFTER_PROCESSING', async () => {
        const provider = new MockPaymentProvider(
            MockPaymentProviderMode.TIMEOUT_AFTER_PROCESSING
        );

        await expect(
            provider.execute(request)
        ).rejects.toBeInstanceOf(
            PaymentProviderUncertainOutcomeError
        );
    });

    it('throws provider error for PROVIDER_ERROR', async () => {
        const provider = new MockPaymentProvider(
            MockPaymentProviderMode.PROVIDER_ERROR
        );

        await expect(
            provider.execute(request)
        ).rejects.toBeInstanceOf(
            PaymentProviderError
        );
    });

    it('returns PAID when querying status after timeout after processing', async () => {
        const provider = new MockPaymentProvider(
            MockPaymentProviderMode.TIMEOUT_AFTER_PROCESSING
        );

        await expect(
            provider.execute(request)
        ).rejects.toBeInstanceOf(
            PaymentProviderConnectionError
        );

        const result = await provider.queryStatus({
            idempotencyKey: request.idempotencyKey,
            paymentId: request.paymentId
        });

        expect(result).toEqual({
            status: PaymentProviderStatus.PAID,
            providerReference: 'mock:payment-1',
        });
    });

    it('returns PAID when querying status after successful processing', async () => {
        const provider = new MockPaymentProvider(
            MockPaymentProviderMode.ONLINE_SUCCESS
        );

        await provider.execute(request);

        const result = await provider.queryStatus({
            idempotencyKey: request.idempotencyKey,
            paymentId: request.paymentId
        });

        expect(result).toEqual({
            status: PaymentProviderStatus.PAID,
            providerReference: 'mock:payment-1',
        });
    });

    it('returns PENDING for unknown payment', async () => {
        const provider = new MockPaymentProvider(
            MockPaymentProviderMode.ONLINE_SUCCESS
        );

        const result = await provider.queryStatus({
            idempotencyKey: request.idempotencyKey,
            paymentId: request.paymentId
        });

        expect(result).toEqual({
            status: PaymentProviderStatus.PENDING,
        });
    });
});