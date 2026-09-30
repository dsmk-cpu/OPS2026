import {PaymentRepository} from "../../ports/PaymentRepository.js";
import {PaymentProvider, PaymentProviderStatus} from "../../ports/PaymentProvider.js";
import {PaymentNotFoundError} from "../../errors/PaymentNotFoundError.js";
import {PaymentProviderError} from "../../errors/PaymentProviderError.js";
import {PaymentProviderConnectionError} from "../../errors/PaymentProviderConnectionError.js";
import {PaymentProviderUncertainOutcomeError} from "../../errors/PaymentProviderUncertainOutcomeError.js";
import {Logger} from "pino";


type Clock = () => Date;

export class ProcessPayment {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentProvider: PaymentProvider,
        private readonly logger: Logger,
        private readonly clock: Clock = () => new Date()) {}

    async execute(paymentId: string): Promise<void> {
        const payment = await this.paymentRepository.findById(paymentId);
        if (!payment) {
            throw new PaymentNotFoundError(paymentId, 'paymentId');
        }

        this.logger.info({
            paymentId: payment.id,
            parkingId: payment.parkingId,
            status: payment.status,
        }, 'Payment processing started');

        let res;

        try {
            res = await this.paymentProvider.execute({
                paymentId: payment.id,
                amountInCents: payment.amountInCents,
                currency: payment.currency,
                idempotencyKey: payment.idempotencyKey
            });
        } catch (error) {

            /*
            It could happen that the provider has already processed the payment,
            even though we did not receive a response. Reconciliation prevents
            executing the same payment again
            */
            if (error instanceof PaymentProviderUncertainOutcomeError) {
                const now = this.clock();

                const retryDelay = this.calculateRetryDelay(payment.retryCount);
                const nextRetryAt = new Date(now.getTime() + retryDelay);

                payment.markForReconciliation(nextRetryAt, now);
                await this.paymentRepository.save(payment);

                this.logger.warn({
                    paymentId: payment.id,
                    retryCount: payment.retryCount + 1,
                    nextRetryAt
                }, 'Payment outcome uncertain, reconciliation is scheduled');

                return;
            }

            /*
            A connection failure does not confirm that the payment was processes.
            That's why we keep the payment pending and retry it later again
             */
            if (error instanceof PaymentProviderConnectionError){
                const now = this.clock();

                const retryDelay = this.calculateRetryDelay(payment.retryCount);
                const nextRetryAt = new Date(now.getTime() + retryDelay);

                payment.registerFailedAttempts(nextRetryAt, now);
                await this.paymentRepository.save(payment);

                this.logger.warn({
                    paymentId: payment.id,
                    retryCount: payment.retryCount + 1,
                    nextRetryAt
                }, 'Payment provider unavailable, retry is scheduled')

                return;
            }

            throw error;
        }
        /*
        PAID means that the payment was successfully authorized. Capture is handled
        though CapturePayment
         */
        if (res.status === PaymentProviderStatus.PAID){
            if (!res.providerReference) {
                throw new PaymentProviderError('Paid provider result requires a provider reference');
            }

            const now = this.clock();

            payment.markPaid(res.providerReference, now);
            await this.paymentRepository.save(payment);

            this.logger.info({
                paymentId: payment.id,
                providerReference: res.providerReference,
                status: payment.status,
            }, 'Payment authorized successfully');

            return;
        }

        if (res.status === PaymentProviderStatus.DECLINED){
            payment.markCancelled();
            await this.paymentRepository.save(payment);

            this.logger.info({
                paymentId: payment.id,
                status: payment.status,
            }, 'Payment declined');

            return;
        }

        /*
        Retry delays double after every failed attempt but is capped at the
        configuration max delay
         */
        if (res.status === PaymentProviderStatus.PENDING){
            const now = this.clock();
            const nextStatusCheck = new Date(now.getTime() + 30_000);

            payment.scheduleStatusCheck(nextStatusCheck, now);

            await this.paymentRepository.save(payment);

            this.logger.info({
                paymentId: payment.id,
                nextRetryAt: nextStatusCheck
            }, 'Payment still pending, next status check is scheduled');
        }
    }

    private calculateRetryDelay(retryCount: number): number {
        const baseDelayMs = 30_000;
        const maxDelayMs = 30 * 60_000;

        return Math.min(baseDelayMs * (2 ** retryCount), maxDelayMs);
    }
}