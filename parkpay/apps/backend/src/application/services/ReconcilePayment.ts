import type { PaymentRepository } from '../../ports/PaymentRepository.js';
import {type PaymentProvider, PaymentProviderStatus } from '../../ports/PaymentProvider.js';
import { PaymentNotFoundError } from '../../errors/PaymentNotFoundError.js';
import { PaymentProviderError } from '../../errors/PaymentProviderError.js';
import {PaymentProviderConnectionError} from "../../errors/PaymentProviderConnectionError.js";
import {Logger} from "pino";

type Clock = () => Date;
export class ReconcilePayment {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentProvider: PaymentProvider,
        private readonly logger: Logger,
        private readonly clock: Clock = () => new Date()
    ) {}

    async execute(paymentId: string): Promise<void> {
        const payment =
            await this.paymentRepository.findById(paymentId);

        if (!payment) {
            throw new PaymentNotFoundError(paymentId, 'paymentId');
        }

        this.logger.info({
            paymentId: payment.id,
            providerReference: payment.paymentProviderReference
        }, 'Payment reconciliation started')

        let result;

        try {
            const query = {
                idempotencyKey: payment.idempotencyKey,
                paymentId: payment.id,
                ...(payment.paymentProviderReference
                    ? { providerReference: payment.paymentProviderReference }
                    : {}),
            };
            // Reconciliation queries the provider instead of creating a new payment
            // This prevents duplicate payments / charges after an uncertain provider response
            result = await this.paymentProvider.queryStatus(query);

            this.logger.info({
                paymentId: payment.id,
                providerStatus: result.status,
                providerReference: result.providerReference
            }, 'Payment reconciliation result received');

        } catch (error){
            if (error instanceof PaymentProviderConnectionError) {
                const now = this.clock();

                const retryDelay = this.calculateRetryDelay(payment.retryCount);
                const nextRetryAt = new Date(now.getTime() + retryDelay);

                /*
                As the provider cannot be reached at the moment, we keep the
                payment in reconciliation and retry it later again
                 */
                payment.markForReconciliation(nextRetryAt, now);

                await this.paymentRepository.save(payment);

                this.logger.warn({
                    paymentId: payment.id,
                    retryCount: payment.retryCount + 1,
                    nextRetryAt
                }, 'Payment reconciliation failed due to connection error. Retry is scheduled');

                return;
            }
            throw error;
        }

        // Provider confirms that authorization succeeded, the payment can proceed
        if (result.status === PaymentProviderStatus.PAID) {
            if (!result.providerReference) {
                throw new PaymentProviderError('Paid provider result requires a provider reference');
            }

            payment.markPaid(result.providerReference);
            await this.paymentRepository.save(payment);

            this.logger.info({
                paymentId: payment.id,
                status: payment.status,
            }, 'Payment reconciliation completed');

            return;
        }

        /*
        The provider still reports a pending state.
        We do not create another payment, we schedule a retry for the current payment
         */
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