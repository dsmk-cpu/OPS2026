import {PaymentProvider, PaymentProviderStatus } from "../../ports/PaymentProvider.js";
import { PaymentRepository } from "../../ports/PaymentRepository.js";
import {PaymentStatus} from "../../domain/PaymentStatus.js";
import {PaymentProviderError} from "../../errors/PaymentProviderError.js";
import {PaymentProviderConnectionError} from "../../errors/PaymentProviderConnectionError.js";

type Clock = () => Date;

export class CapturePayment {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentProvider: PaymentProvider,
        private readonly clock: Clock = () => new Date(),
    ) {}

    async execute(paymentId: string): Promise<void> {
        const payment = await this.paymentRepository.findById(paymentId);

        if (!payment) {
            return;
        }

        if (payment.status !== PaymentStatus.PAID) {
            return;
        }

        if (!payment.paymentProviderReference) {
            throw new PaymentProviderError("Cannot capture payment without provider reference");
        }

        try {
            const result = await this.paymentProvider.capture({
                providerReference: payment.paymentProviderReference,
            });

            if (result.status === PaymentProviderStatus.CAPTURED) {
                payment.markCaptured(this.clock());
                await this.paymentRepository.save(payment);
                return;
            }

            if (result.status === PaymentProviderStatus.PENDING) {
                const now = this.clock();
                const nextRetryAt = new Date(
                    now.getTime() + this.calculateRetryDelay(payment.retryCount)
                );

                payment.scheduleStatusCheck(nextRetryAt, now);
                await this.paymentRepository.save(payment);
            }
        } catch (error) {
            if (error instanceof PaymentProviderConnectionError) {
                const now = this.clock();
                const nextRetryAt = new Date(
                    now.getTime() + this.calculateRetryDelay(payment.retryCount)
                );

                payment.registerCaptureFailedAttempt(nextRetryAt, now);
                await this.paymentRepository.save(payment);
                return;
            }
            throw error;
        }
    }

    private calculateRetryDelay(retryCount: number): number {
        const baseDelay = 30_000;
        const maxDelay = 30 * 60_000;

        return Math.min(
            baseDelay * 2 ** retryCount,
            maxDelay,
        );
    }
}