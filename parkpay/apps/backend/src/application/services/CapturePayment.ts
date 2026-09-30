import {PaymentProvider, PaymentProviderStatus } from "../../ports/PaymentProvider.js";
import { PaymentRepository } from "../../ports/PaymentRepository.js";
import {PaymentStatus} from "../../domain/PaymentStatus.js";
import {PaymentProviderError} from "../../errors/PaymentProviderError.js";
import {PaymentProviderConnectionError} from "../../errors/PaymentProviderConnectionError.js";
import {Logger} from "pino";

type Clock = () => Date;

export class CapturePayment {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentProvider: PaymentProvider,
        private readonly logger: Logger,
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

        /*
        Capture is separated from authorization
        -> So if a capture fails, the existing authorization can be retried again
           without executing the payment
         */
        try {
            this.logger.info({
                paymentId: payment.id,
                providerReference: payment.paymentProviderReference
            }, 'Payment capture started');

            const result = await this.paymentProvider.capture({
                providerReference: payment.paymentProviderReference,
            });

            if (result.status === PaymentProviderStatus.CAPTURED) {
                payment.markCaptured(this.clock());
                await this.paymentRepository.save(payment);

                this.logger.info({
                    paymentId: payment.id,
                    providerReference: payment.paymentProviderReference,
                    status: payment.status
                }, 'Payment captured successfully');

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
            // Authorization still remains valid, only the capture needs to be retried
            if (error instanceof PaymentProviderConnectionError) {
                const now = this.clock();
                const nextRetryAt = new Date(
                    now.getTime() + this.calculateRetryDelay(payment.retryCount)
                );

                payment.registerCaptureFailedAttempt(nextRetryAt, now);
                await this.paymentRepository.save(payment);

                this.logger.warn({
                    paymentId: payment.id,
                    retryCount: payment.retryCount + 1,
                    nextRetryAt,
                }, 'Payment capture failed due to a connection error. Retry is scheduled');

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