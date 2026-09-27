import {PaymentController} from "../controllers/PaymentController.js";
import {Router} from "express";

export function createPaymentRouter(paymentController: PaymentController) : Router {
    const router = Router();

    router.post('/', (req, res) => paymentController.create(req, res));
    router.get('/:id', (req, res) => paymentController.get(req, res));

    return router;
}