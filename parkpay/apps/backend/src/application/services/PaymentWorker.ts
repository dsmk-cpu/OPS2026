import {PaymentRepository} from "../../ports/PaymentRepository.js";
import {ProcessPayment} from "./ProcessPayment.js";
import {ReconcilePayment} from "./ReconcilePayment.js";
import {Logger} from "pino";
import {PaymentStatus} from "../../domain/PaymentStatus.js";
import {CapturePayment} from "./CapturePayment.js";

type Clock = () => Date;

export class PaymentWorker {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly processPayment: ProcessPayment,
        private readonly reconcilePayment: ReconcilePayment,
        private readonly capturePayment: CapturePayment,
        private readonly logger: Logger,
        private readonly clock: Clock = () => new Date()
    ) {}

    async runOnce(): Promise<void> {
        const now = this.clock();

        const payments = await this.paymentRepository.findDue(now);

        /*
        Due payments are handled according to their current state.
        Reconcile: resolves uncertain provider outcome before attempting another payment.
        Pending: still requires authorization
        Paid: payment is authorized but still requires capture
         */
        for (const payment of payments) {
            try {
                this.logger.debug({
                        paymentId: payment.id,
                        status: payment.status,
                        requiresReconciliation: payment.requiresReconciliation,
                    }, 'Payment worker processing due payment');

                if (payment.requiresReconciliation) {
                    await this.reconcilePayment.execute(payment.id);
                    continue;
                }
                if (payment.status === PaymentStatus.PENDING) {
                    await this.processPayment.execute(payment.id);
                    continue;
                }

                if (payment.status === PaymentStatus.PAID) {
                    await this.capturePayment.execute(payment.id);
                }

            } catch (error) {
                this.logger.error({err: error, paymentId: payment.id,}, 'Payment worker failed to process payment');
            }
        }
    }
}