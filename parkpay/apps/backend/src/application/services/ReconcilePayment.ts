import type { PaymentRepository } from '../../ports/PaymentRepository.js';
import {type PaymentProvider, PaymentProviderStatus } from '../../ports/PaymentProvider.js';
import { PaymentNotFoundError } from '../../errors/PaymentNotFoundError.js';
import { PaymentProviderError } from '../../errors/PaymentProviderError.js';
import {PaymentProviderConnectionError} from "../../errors/PaymentProviderConnectionError.js";

type Clock = () => Date;
export class ReconcilePayment {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentProvider: PaymentProvider,
        private readonly clock: Clock = () => new Date()
    ) {}

    async execute(paymentId: string): Promise<void> {
        const payment =
            await this.paymentRepository.findById(paymentId);

        if (!payment) {
            throw new PaymentNotFoundError(paymentId, 'paymentId');
        }

        let result;

        try {
            result = await this.paymentProvider.queryStatus({
                idempotencyKey: payment.idempotencyKey,
            });
        } catch (error){
            if (error instanceof PaymentProviderConnectionError) {
                const now = this.clock();

                const retryDelay = this.calculateRetryDelay(payment.retryCount);
                const nextRetryAt = new Date(now.getTime() + retryDelay);

                payment.registerFailedAttempts(nextRetryAt, now);
                await this.paymentRepository.save(payment);
                return;
            }
            throw error;
        }

        if (result.status === PaymentProviderStatus.PAID) {
            if (!result.providerReference) {
                throw new PaymentProviderError('Paid provider result requires a provider reference');
            }

            payment.markPaid(result.providerReference);
            await this.paymentRepository.save(payment);
            return;
        }

        if (result.status === PaymentProviderStatus.PENDING) {
            const now = this.clock();

            const nextStatusCheck = new Date(now.getTime() + 30_000);
            payment.scheduleStatusCheck(nextStatusCheck, now);
            await this.paymentRepository.save(payment);
            return;
        }
    }

    private calculateRetryDelay(retryCount: number): number {
        const baseDelayMs = 30_000;
        const maxDelayMs = 30 * 60_000;

        return Math.min(baseDelayMs * (2 ** retryCount), maxDelayMs);
    }
}