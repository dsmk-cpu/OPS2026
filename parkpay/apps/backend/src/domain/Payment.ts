import {Currency} from "./Currency.js";
import {PaymentStatus} from "./PaymentStatus.js";

export class Payment {

    constructor(
        public readonly id: string,
        public readonly parkingId: number,
        public readonly idempotencyKey: string,
        public readonly licensePlate: string,
        public readonly amountInCents: number,
        public readonly currency: Currency,
        public status: PaymentStatus,
        public paymentProviderReference: string | null,
        public retryCount: number,
        public nextRetryAt: Date | null,
        public lastAttemptAt: Date | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) {}
}