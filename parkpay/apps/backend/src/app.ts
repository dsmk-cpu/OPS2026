import express from 'express';
import {PaymentOrmRepository} from "./infrastructure/persistence/PaymentOrmRepository.js";
import {AppDataSource} from "./config/data-source.js";
import {PaymentEntity} from "./infrastructure/persistence/PaymentEntity.js";
import {CreatePayment} from "./application/services/CreatePayment.js";
import {PaymentController} from "./presentation/controllers/PaymentController.js";
import {createPaymentRouter} from "./presentation/routes/PaymentRoutes.js";
import {GetPayment} from "./application/services/GetPayment.js";
import {errorHandler} from "./errors/ErrorHandler.js";
import {pinoHttp} from "pino-http";
import {logger} from "./infrastructure/logging/logger.js";
import {randomUUID} from "node:crypto";
import {apiKeyAuth} from "./presentation/middleware/apiKeyAuth.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

export const app = express();

app.use(helmet());

app.disable('x-powered-by');

app.use(pinoHttp({
    logger,
    genReqId: (req, res) => {
        const requestId = randomUUID();
        res.setHeader('X-Request-Id', requestId);
        return requestId;
        },
    }),
);

app.use(
    express.json({
        limit: '10kb',
    }),
);

export const paymentRepository = new PaymentOrmRepository(AppDataSource.getRepository(PaymentEntity));
const createPayment  = new CreatePayment(paymentRepository);
const getPayment  = new GetPayment(paymentRepository);
const paymentController = new PaymentController(createPayment, getPayment);

const parkPayRateLimit = rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/parkpay/v1', parkPayRateLimit, apiKeyAuth, createPaymentRouter(paymentController));

app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
    });
});

app.use(errorHandler);