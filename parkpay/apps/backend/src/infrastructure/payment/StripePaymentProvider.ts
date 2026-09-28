import {
    ExecutePaymentRequest,
    ExecutePaymentResult,
    PaymentProvider,
    PaymentProviderStatus,
    QueryPaymentStatusRequest,
    QueryPaymentStatusResult
} from "../../ports/PaymentProvider.js";
import {Stripe} from "stripe";
import {PaymentProviderConnectionError} from "../../errors/PaymentProviderConnectionError.js";
import {PaymentProviderError} from "../../errors/PaymentProviderError.js";

export interface StripePaymentProviderOptions {
    testPaymentMethod?: string;
}

export class StripePaymentProvider implements PaymentProvider {
    constructor(private readonly stripe: Stripe,
                private readonly options: StripePaymentProviderOptions = {}
    ) {}

    async execute(request: ExecutePaymentRequest): Promise<ExecutePaymentResult> {

        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                    amount: request.amountInCents,
                    currency: request.currency.toLowerCase(),

                    ...(this.options.testPaymentMethod
                        ? {
                            payment_method: this.options.testPaymentMethod,
                            confirm: true,
                            automatic_payment_methods: {
                                enabled: true,
                                allow_redirects: 'never',
                            },
                        }
                        : {}),

                    metadata: {
                        paymentId: request.paymentId,
                        idempotencyKey: request.idempotencyKey,
                    },
                },
                {
                    idempotencyKey: request.idempotencyKey,
                },
            );

            return {
                status: this.mapStatus(paymentIntent.status),
                providerReference: paymentIntent.id
            };
        } catch (error) {
            if (error instanceof Stripe.errors.StripeCardError) {
                return {
                    status: PaymentProviderStatus.DECLINED
                };
            }

            throw this.mapError(error);
        }
    }

    async queryStatus(request: QueryPaymentStatusRequest): Promise<QueryPaymentStatusResult>{
        try {
            if (!request.providerReference){
               const search = await this.stripe.paymentIntents.search({
                    query: `metadata["paymentId"]:"${request.paymentId}"`,
                    limit: 1,
                });
                const paymentIntent = search.data[0];

                if (!paymentIntent) {
                    return {
                        status: PaymentProviderStatus.PENDING
                    };
                }
                return {
                    status: this.mapStatus(paymentIntent.status),
                    providerReference: paymentIntent.id
                };
            }

            const paymentIntent = await this.stripe.paymentIntents.retrieve(request.providerReference);

            return {
                status: this.mapStatus(paymentIntent.status),
                providerReference: paymentIntent.id
            };
        } catch (error) {
            throw this.mapError(error);
        }
    }


    private mapStatus(status: Stripe.PaymentIntent.Status,): PaymentProviderStatus {
        switch (status) {
            case 'succeeded':
                return PaymentProviderStatus.PAID;
            case 'canceled':
                return PaymentProviderStatus.DECLINED;
            default:
                return PaymentProviderStatus.PENDING;
        }
    }

    private mapError(error: unknown): Error {
        if (error instanceof Stripe.errors.StripeConnectionError) {
            return new PaymentProviderConnectionError('Stripe connection failed');
        }

        if (error instanceof Stripe.errors.StripeAPIError) {
            return new PaymentProviderError('Stripe API error');
        }

        if (error instanceof Error) {
            return new PaymentProviderError(error.message);
        }

        return new PaymentProviderError('Unknown Stripe error');
    }
}