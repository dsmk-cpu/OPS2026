import {PaymentProvider} from "../../ports/PaymentProvider.js";
import {MockPaymentProvider, MockPaymentProviderMode} from "./MockPaymentProvider.js";
import {Stripe} from "stripe";
import {StripePaymentProvider} from "./StripePaymentProvider.js";

export function createPaymentProvider(): PaymentProvider {
    const provider = process.env.PAYMENT_PROVIDER ?? 'mock';

    switch (provider) {
        case 'mock':
            return new MockPaymentProvider(MockPaymentProviderMode.TIMEOUT_AFTER_PROCESSING);

        case 'stripe': {
            const secretKey = process.env.STRIPE_SECRET_KEY;

            if (!secretKey) {
                throw new Error('STRIPE_SECRET_KEY is required when PAYMENT_PROVIDER=stripe',);
            }


            return new StripePaymentProvider(new Stripe(secretKey), {
                ...(process.env.STRIPE_TEST_PAYMENT_METHOD ? {
                    testPaymentMethod: process.env.STRIPE_TEST_PAYMENT_METHOD
                }
                : {}),
            });
        }

        default:
            throw new Error(`Unsupported payment provider: ${provider}`);
    }
}