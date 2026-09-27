import express from 'express';
import {PaymentOrmRepository} from "./infrastructure/persistence/PaymentOrmRepository.js";
import {AppDataSource} from "./config/data-source.js";
import {PaymentEntity} from "./infrastructure/persistence/PaymentEntity.js";
import {CreatePayment} from "./application/services/CreatePayment.js";
import {PaymentController} from "./presentation/controllers/PaymentController.js";
import {createPaymentRouter} from "./presentation/routes/PaymentRoutes.js";
import {GetPayment} from "./application/services/GetPayment.js";
import {errorHandler} from "./errors/ErrorHandler.js";

export const app = express();

app.disable('x-powered-by');

app.use(
    express.json({
        limit: '10kb',
    }),
);

const paymentRepository = new PaymentOrmRepository(AppDataSource.getRepository(PaymentEntity));
const createPayment  = new CreatePayment(paymentRepository);
const getPayment  = new GetPayment(paymentRepository);
const paymentController = new PaymentController(createPayment, getPayment);


app.use('/parkpay/v1', createPaymentRouter(paymentController));

app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
    });
});

app.use(errorHandler);