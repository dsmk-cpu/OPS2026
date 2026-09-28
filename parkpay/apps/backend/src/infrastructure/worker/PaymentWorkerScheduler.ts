import {PaymentWorker} from "../../application/services/PaymentWorker.js";
import {Logger} from "pino";


export class PaymentWorkerScheduler {
    private intervalId: NodeJS.Timeout | null = null;

    constructor(
        private readonly paymentWorker: PaymentWorker,
        private readonly logger: Logger,
        private readonly intervalMs: number = 5_000
    ) {}

    start(): void {
        if (this.intervalId !== null) {
            return;
        }
        this.intervalId = setInterval(async () => {
            try {
                await this.paymentWorker.runOnce();
            } catch (error) {
                this.logger.error({err: error}, 'Payment worker run failed');
            }
        }, this.intervalMs);
    }

    stop(): void {
        if (this.intervalId === null) {
            return;
        }
        clearInterval(this.intervalId);
        this.intervalId = null;
    }
}