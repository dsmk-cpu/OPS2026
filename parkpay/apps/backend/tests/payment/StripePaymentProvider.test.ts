import { describe, expect, it, vi } from 'vitest';

import { StripePaymentProvider } from '../../src/infrastructure/payment/StripePaymentProvider.js';
import { PaymentProviderStatus } from '../../src/ports/PaymentProvider.js';
import {PaymentProviderConnectionError} from "../../src/errors/PaymentProviderConnectionError.js";
import {Stripe} from "stripe";
import {PaymentProviderError} from "../../src/errors/PaymentProviderError.js";

describe('StripePaymentProvider', () => {
    it('returns CAPTURED when Stripe PaymentIntent succeeded', async () => {
        const stripe = {
            paymentIntents: {
                retrieve: vi.fn().mockResolvedValue({
                    id: 'pi_123',
                    status: 'succeeded'
                }),
            },
        };

        const provider = new StripePaymentProvider(stripe as any);

        const result = await provider.queryStatus({
            paymentId: 'payment-1',
            idempotencyKey: 'payment:payment-1',
            providerReference: 'pi_123'
        });

        expect(stripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_123');

        expect(result).toEqual({
            status: PaymentProviderStatus.CAPTURED,
            providerReference: 'pi_123'
        });
    });

    it('returns PENDING when Stripe PaymentIntent requires a payment method', async () => {
        const stripe = {
            paymentIntents: {
                retrieve: vi.fn().mockResolvedValue({
                    id: 'pi_123',
                    status: 'requires_payment_method'
                }),
            },
        };

        const provider = new StripePaymentProvider(stripe as any,);

        const result = await provider.queryStatus({
            paymentId: 'payment-1',
            idempotencyKey: 'payment:payment-1',
            providerReference: 'pi_123'
        });

        expect(result).toEqual({
            status: PaymentProviderStatus.PENDING,
            providerReference: 'pi_123'
        });
    });

    it('returns DECLINED when Stripe PaymentIntent is canceled', async () => {
        const stripe = {
            paymentIntents: {
                retrieve: vi.fn().mockResolvedValue({
                    id: 'pi_123',
                    status: 'canceled'
                }),
            },
        };

        const provider = new StripePaymentProvider(stripe as any,);

        const result = await provider.queryStatus({
            paymentId: 'payment-1',
            idempotencyKey: 'payment:payment-1',
            providerReference: 'pi_123'
        });

        expect(result).toEqual({
            status: PaymentProviderStatus.DECLINED,
            providerReference: 'pi_123'
        });
    });

    it('creates a Stripe PaymentIntent with the correct data', async () => {
        const stripe = {
            paymentIntents: {
                create: vi.fn().mockResolvedValue({
                    id: 'pi_123',
                    status: 'requires_capture'
                }),
            },
        };

        const provider = new StripePaymentProvider(stripe as any,);

        const result = await provider.execute({
            paymentId: 'payment-1',
            amountInCents: 1250,
            currency: 'EUR',
            idempotencyKey: 'payment:payment-1'
        });

        expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
            {
                amount: 1250,
                currency: 'eur',
                capture_method: 'manual',
                metadata: {
                    paymentId: 'payment-1',
                    idempotencyKey: 'payment:payment-1',
                },
            },
            {
                idempotencyKey: 'payment:payment-1',
            },
        );

        expect(result).toEqual({
            status: PaymentProviderStatus.PAID,
            providerReference: 'pi_123'
        });
    });

    it('maps StripeConnectionError to PaymentProviderConnectionError', async () => {
        const stripe = {
            paymentIntents: {
                create: vi.fn().mockRejectedValue(
                    new Stripe.errors.StripeConnectionError({
                        message: 'Connection failed'
                    }),
                ),
            },
        };

        const provider = new StripePaymentProvider(stripe as any);

        await expect(
            provider.execute({
                paymentId: 'payment-1',
                amountInCents: 1250,
                currency: 'EUR',
                idempotencyKey: 'payment:payment-1'
            }),
        ).rejects.toBeInstanceOf(PaymentProviderConnectionError);
    });

    it('maps StripeAPIError to PaymentProviderError', async () => {
        const stripe = {
            paymentIntents: {
                create: vi.fn().mockRejectedValue(
                    new Stripe.errors.StripeAPIError({
                        message: 'Stripe API failed'
                    }),
                ),
            },
        };

        const provider = new StripePaymentProvider(stripe as any);

        await expect(
            provider.execute({
                paymentId: 'payment-1',
                amountInCents: 1250,
                currency: 'EUR',
                idempotencyKey: 'payment:payment-1'
            }),
        ).rejects.toBeInstanceOf(PaymentProviderError);
    });

    it('maps unknown errors to PaymentProviderError', async () => {
        const stripe = {
            paymentIntents: {
                create: vi.fn().mockRejectedValue(
                    new Error('Unexpected error'),
                ),
            },
        };

        const provider = new StripePaymentProvider(
            stripe as any,
        );

        await expect(
            provider.execute({
                paymentId: 'payment-1',
                amountInCents: 1250,
                currency: 'EUR',
                idempotencyKey: 'payment:payment-1'
            }),
        ).rejects.toBeInstanceOf(PaymentProviderError,);
    });

    it('returns PENDING when no PaymentIntent can be recovered', async () => {
        const stripe = {
            paymentIntents: {
                search: vi.fn().mockResolvedValue({
                    data: [],
                }),
            },
        };

        const provider = new StripePaymentProvider(stripe as any);

        const result = await provider.queryStatus({
            paymentId: 'payment-1',
            idempotencyKey: 'payment:payment-1'
        });

        expect(stripe.paymentIntents.search,).toHaveBeenCalledWith({
            query: 'metadata["paymentId"]:"payment-1"',
            limit: 1
        });

        expect(result).toEqual({
            status: PaymentProviderStatus.PENDING
        });
    });


    it('recovers PaymentIntent by paymentId when provider reference is missing', async () => {
        const stripe = {
            paymentIntents: {
                search: vi.fn().mockResolvedValue({
                    data: [
                        {
                            id: 'pi_123',
                            status: 'succeeded'
                        },
                    ],
                }),
            },
        };

        const provider = new StripePaymentProvider(stripe as any);

        const result = await provider.queryStatus({
            paymentId: 'payment-1',
            idempotencyKey: 'payment:payment-1'
        });

        expect(stripe.paymentIntents.search).toHaveBeenCalledWith({
            query: 'metadata["paymentId"]:"payment-1"',
            limit: 1
        });

        expect(result).toEqual({
            status: PaymentProviderStatus.CAPTURED,
            providerReference: 'pi_123'
        });
    });

    it('returns PENDING when no PaymentIntent can be recovered', async () => {
        const stripe = {
            paymentIntents: {
                search: vi.fn().mockResolvedValue({
                    data: []
                }),
            },
        };

        const provider = new StripePaymentProvider(stripe as any);

        const result = await provider.queryStatus({
            paymentId: 'payment-1',
            idempotencyKey: 'payment:payment-1'
        });

        expect(result).toEqual({status: PaymentProviderStatus.PENDING});
    });
    it('maps Stripe search connection errors to PaymentProviderConnectionError', async () => {
        const stripe = {
            paymentIntents: {
                search: vi.fn().mockRejectedValue(
                    new Stripe.errors.StripeConnectionError({
                        message: 'Connection failed'
                    }),
                ),
            },
        };

        const provider = new StripePaymentProvider(stripe as any);

        await expect(
            provider.queryStatus({
                paymentId: 'payment-1',
                idempotencyKey: 'payment:payment-1'
            }),
        ).rejects.toBeInstanceOf(
            PaymentProviderConnectionError,
        );
    });

    it('returns DECLINED when Stripe rejects the card', async () => {
        const stripe = {
            paymentIntents: {
                create: vi.fn().mockRejectedValue(
                    new Stripe.errors.StripeCardError({message: 'Your card was declined.'})
                ),
            },
        };

        const provider = new StripePaymentProvider(
            stripe as any,
            {
                testPaymentMethod: 'pm_card_visa_chargeDeclined',
            },
        );

        const result = await provider.execute({
            paymentId: 'payment-1',
            amountInCents: 1250,
            currency: 'EUR',
            idempotencyKey: 'payment:payment-1'
        });

        expect(result).toEqual({status: PaymentProviderStatus.DECLINED});
    });

    it('returns PAID when Stripe PaymentIntent requires capture', async () => {
        const stripe = {
            paymentIntents: {
                retrieve: vi.fn().mockResolvedValue({
                    id: 'pi_123',
                    status: 'requires_capture'
                }),
            },
        };

        const provider = new StripePaymentProvider(stripe as any);

        const result = await provider.queryStatus({
            paymentId: 'payment-1',
            idempotencyKey: 'payment:payment-1',
            providerReference: 'pi_123'
        });

        expect(result).toEqual({
            status: PaymentProviderStatus.PAID,
            providerReference: 'pi_123'
        });
    });

    it('captures an authorized Stripe PaymentIntent', async () => {
        const stripe = {
            paymentIntents: {
                capture: vi.fn().mockResolvedValue({
                    id: 'pi_123',
                    status: 'succeeded'
                }),
            },
        };

        const provider = new StripePaymentProvider(stripe as any);

        const result = await provider.capture({providerReference: 'pi_123'});

        expect(stripe.paymentIntents.capture).toHaveBeenCalledWith('pi_123');

        expect(result).toEqual({
            status: PaymentProviderStatus.CAPTURED,
            providerReference: 'pi_123'
        });
    });

    it('maps Stripe connection error during capture', async () => {
        const stripe = {
            paymentIntents: {
                capture: vi.fn().mockRejectedValue(
                    new Stripe.errors.StripeConnectionError({
                        message: 'Connection failed'
                    }),
                ),
            },
        };

        const provider = new StripePaymentProvider(stripe as any);

        await expect(provider.capture({providerReference: 'pi_123'})).rejects.toBeInstanceOf(PaymentProviderConnectionError);
    });
});