import { CreatePayment } from "../../application/services/CreatePayment.js";
import { CreatePaymentRequestSchema } from "../schemas/CreatePaymentRequestSchema.js";
import { RequestValidationError } from "../../errors/RequestValidationError.js";
import { toCreatePaymentCommand } from "../mappers/CreatePaymentRequestMapper.js";
import { toCreatePaymentResponse } from "../mappers/CreatePaymentResponseMapper.js";
import type { Request, Response } from 'express';
import {GetPayment} from "../../application/services/GetPayment.js";
import {GetPaymentParameterSchema} from "../schemas/GetPaymentParameterSchema.js";
import {toGetPaymentResponse} from "../mappers/GetPaymentResponseMapper.js";

export class PaymentController {
    constructor(
        private readonly createPayment: CreatePayment,
        private readonly getPayment: GetPayment
    ) {}

    async create(req: Request, res: Response): Promise<void> {
        const parsedRequest = CreatePaymentRequestSchema.safeParse(req.body);

        if (!parsedRequest.success) {
            throw new RequestValidationError(parsedRequest.error.issues)
        }

        const command = toCreatePaymentCommand(parsedRequest.data);
        const result = await this.createPayment.execute(command);
        const response = toCreatePaymentResponse(result);

        res.status(result.created ? 201 : 200).json(response);
    }

    async get(req: Request, res: Response): Promise<void> {
        const parsedParams = GetPaymentParameterSchema.safeParse(req.params);

        if (!parsedParams.success) {
            throw new RequestValidationError(parsedParams.error.issues);
        }

        const result = await this.getPayment.execute(parsedParams.data.id);
        const response = toGetPaymentResponse(result);

        res.status(200).json(response);
    }
}