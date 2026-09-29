import {app, paymentRepository} from './app.js';
import {AppDataSource} from './config/data-source.js';
import {logger} from "./infrastructure/logging/logger.js";
import {MockPaymentProvider, MockPaymentProviderMode} from "./infrastructure/payment/MockPaymentProvider.js";
import {ProcessPayment} from "./application/services/ProcessPayment.js";
import {ReconcilePayment} from "./application/services/ReconcilePayment.js";
import {PaymentWorker} from "./application/services/PaymentWorker.js";
import {PaymentWorkerScheduler} from "./infrastructure/worker/PaymentWorkerScheduler.js";
import {createPaymentProvider} from "./infrastructure/payment/createPaymentProvider.js";
import {CapturePayment} from "./application/services/CapturePayment.js";

const port = Number(process.env.PORT ?? 3000);

async function start(): Promise<void> {
    try {
        await AppDataSource.initialize();
        logger.info('Database connection established.');

        await AppDataSource.runMigrations();
        logger.info('Database migrations complete.');

        const paymentProvider = createPaymentProvider();
        const processPayment = new ProcessPayment(paymentRepository, paymentProvider);
        const reconcilePayment = new ReconcilePayment(paymentRepository, paymentProvider);
        const capturePayment = new CapturePayment(paymentRepository, paymentProvider,);
        const paymentWorker = new PaymentWorker(paymentRepository, processPayment, reconcilePayment,capturePayment, logger);
        const paymentWorkScheduler = new PaymentWorkerScheduler(paymentWorker, logger, 5_000);

        app.listen(port, '0.0.0.0', () => {
            logger.info(`ParkPay backend listening on port ${port}`);

            paymentWorkScheduler.start();
            logger.info(`Payment worker scheduler started.`);
        });
    } catch (error) {
        logger.fatal( {err: error}, 'Failed to start ParkPay backend.');
        process.exit(1);
    }
}

void start();