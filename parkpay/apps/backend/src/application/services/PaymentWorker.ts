import {PaymentRepository} from "../../ports/PaymentRepository.js";
import {ProcessPayment} from "./ProcessPayment.js";
import {ReconcilePayment} from "./ReconcilePayment.js";
import {Logger} from "pino";

type Clock = () => Date;

export class PaymentWorker {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly processPayment: ProcessPayment,
        private readonly reconcilePayment: ReconcilePayment,
        private readonly logger: Logger,
        private readonly clock: Clock = () => new Date()
    ) {}

    async runOnce(): Promise<void> {
        const now = this.clock();

        const payments = await this.paymentRepository.findPendingDue(now);

        for (const payment of payments) {
            try {
                if (payment.requiresReconciliation) {
                    await this.reconcilePayment.execute(payment.id);
                    continue;
                }
                await this.processPayment.execute(payment.id);
            } catch (error) {
                this.logger.error({err: error, paymentId: payment.id,}, 'Payment worker failed to process payment');
            }
        }
    }
}