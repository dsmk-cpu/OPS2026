import {PaymentStatus} from "../domain/PaymentStatus.js";

export class InvalidPaymentTransitionError extends Error {
    constructor(
        public readonly from: PaymentStatus,
        public readonly to: PaymentStatus,
    ) {
        super(`Payment transition from ${from} to ${to} is not allowed.`);
        this.name = "InvalidPaymentTransitionError";
    }
}