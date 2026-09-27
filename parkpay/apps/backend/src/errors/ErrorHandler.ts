import {ErrorRequestHandler} from "express";
import {RequestValidationError} from "./RequestValidationError.js";
import {PaymentNotFoundError} from "./PaymentNotFoundError.js";
import {PaymentConflictError} from "./PaymentConflictError.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {

    if (error instanceof RequestValidationError) {
        req.log.warn({ err: error }, 'Request validation error');
        res.status(400).json({
            title: 'Invalid request',
            status: 400,
            traceId: req.id,
        });
        return;
    }

    if (error instanceof PaymentNotFoundError) {
        req.log.warn( { err: error }, 'Payment not found');
        res.status(404).json({
            title: 'Payment not found',
            status: 404,
            traceId: req.id,
        });
        return;
    }

    if (error instanceof PaymentConflictError){
        req.log.warn( {err: error}, 'Payment conflict')
        res.status(409).json({
            title: 'Payment conflict',
            status: 409,
            traceId: req.id,
        });
        return;
    }

    req.log.error( { err: error }, 'Unexpected application error');

    res.status(500).json({
        title: 'Internal server error',
        status: 500,
        traceId: req.id,
    });
};