import {ErrorRequestHandler} from "express";
import {RequestValidationError} from "./RequestValidationError.js";
import {PaymentNotFoundError} from "./PaymentNotFoundError.js";
import {PaymentConflictError} from "./PaymentConflictError.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof RequestValidationError) {
        res.status(400).json({
            error: error.message,
            details: error.issues
        });
        return;
    }

    if (error instanceof PaymentNotFoundError) {
        res.status(404).json({
            error: error.message
        });
        return;
    }

    if (error instanceof PaymentConflictError){
        res.status(409).json({
            error: error.message
        });
        return;
    }

    console.error(error);

    res.status(500).json({
        error: 'Internal server error'
    });
}