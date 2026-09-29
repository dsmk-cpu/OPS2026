import {PaymentRepository} from "../../ports/PaymentRepository.js";
import {PaymentProvider, PaymentProviderStatus} from "../../ports/PaymentProvider.js";
import {PaymentNotFoundError} from "../../errors/PaymentNotFoundError.js";
import {PaymentProviderError} from "../../errors/PaymentProviderError.js";
import {PaymentProviderConnectionError} from "../../errors/PaymentProviderConnectionError.js";
import {PaymentProviderUncertainOutcomeError} from "../../errors/PaymentProviderUncertainOutcomeError.js";


type Clock = () => Date;

export class ProcessPayment {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentProvider: PaymentProvider,
        private readonly clock: Clock = () => new Date()) {}

    async execute(paymentId: string): Promise<void> {
        const payment = await this.paymentRepository.findById(paymentId);
        if (!payment) {
            throw new PaymentNotFoundError(paymentId, 'paymentId');
        }

        let res;

        try {
            res = await this.paymentProvider.execute({
                paymentId: payment.id,
                amountInCents: payment.amountInCents,
                currency: payment.currency,
                idempotencyKey: payment.idempotencyKey
            });
        } catch (error) {
            if (error instanceof PaymentProviderUncertainOutcomeError) {
                const now = this.clock();

                const retryDelay = this.calculateRetryDelay(payment.retryCount);
                const nextRetryAt = new Date(now.getTime() + retryDelay);

                payment.markForReconciliation(nextRetryAt, now);
                await this.paymentRepository.save(payment);
                return;
            }

            if (error instanceof PaymentProviderConnectionError){
                const now = this.clock();

                const retryDelay = this.calculateRetryDelay(payment.retryCount);
                const nextRetryAt = new Date(now.getTime() + retryDelay);

                payment.registerFailedAttempts(nextRetryAt, now);
                await this.paymentRepository.save(payment);
                return;
            }

            throw error;
        }
        if (res.status === PaymentProviderStatus.PAID){
            if (!res.providerReference) {
                throw new PaymentProviderError('Paid provider result requires a provider reference');
            }

            const now = this.clock();

            payment.markPaid(res.providerReference, now);
            await this.paymentRepository.save(payment);

            return;
        }

        if (res.status === PaymentProviderStatus.DECLINED){
            payment.markCancelled();
            await this.paymentRepository.save(payment);
            return;
        }

        if (res.status === PaymentProviderStatus.PENDING){
            const now = this.clock();
            const nextStatusCheck = new Date(now.getTime() + 30_000);

            payment.scheduleStatusCheck(nextStatusCheck, now);

            await this.paymentRepository.save(payment);
        }
    }

    private calculateRetryDelay(retryCount: number): number {
        const baseDelayMs = 30_000;
        const maxDelayMs = 30 * 60_000;

        return Math.min(baseDelayMs * (2 ** retryCount), maxDelayMs);
    }
}