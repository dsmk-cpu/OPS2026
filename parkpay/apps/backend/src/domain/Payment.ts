import {Currency} from "./Currency.js";
import {PaymentStatus} from "./PaymentStatus.js";
import {InvalidPaymentError} from "../errors/InvalidPaymentError.js";
import {InvalidPaymentTransitionError} from "../errors/InvalidPaymentTransitionError.js";


export interface CreatePaymentValues {
    id: string;
    parkingId: number;
    idempotencyKey: string;
    licensePlate: string;
    amountInCents: number;
    currency: Currency;
    now?: Date;
}

export interface RestorePaymentValues {
    id: string;
    parkingId: number;
    idempotencyKey: string;
    licensePlate: string;
    amountInCents: number;
    currency: Currency;
    status: PaymentStatus;
    paymentProviderReference: string | null;
    retryCount: number;
    nextRetryAt: Date | null;
    lastAttemptAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

interface PaymentState {
    readonly id: string;
    readonly parkingId: number;
    readonly idempotencyKey: string;
    readonly licensePlate: string;
    readonly amountInCents: number;
    readonly currency: Currency;
    status: PaymentStatus;
    paymentProviderReference: string | null;
    retryCount: number;
    nextRetryAt: Date | null;
    lastAttemptAt: Date | null;
    readonly createdAt: Date;
    updatedAt: Date;
}




export class Payment {

    private constructor(
        private readonly state: PaymentState,
    ) {}



    get id(): string {
        return this.state.id;
    }

    get parkingId(): number {
        return this.state.parkingId;
    }

    get idempotencyKey(): string {
        return this.state.idempotencyKey;
    }

    get licensePlate(): string {
        return this.state.licensePlate;
    }

    get amountInCents(): number {
        return this.state.amountInCents;
    }

    get currency(): Currency {
        return this.state.currency;
    }

    get status(): PaymentStatus {
        return this.state.status;
    }

    get paymentProviderReference(): string | null {
        return this.state.paymentProviderReference;
    }

    get retryCount(): number {
        return this.state.retryCount;
    }

    get nextRetryAt(): Date | null {
        return this.state.nextRetryAt;
    }

    get lastAttemptAt(): Date | null {
        return this.state.lastAttemptAt;
    }

    get createdAt(): Date {
        return this.state.createdAt;
    }

    get updatedAt(): Date {
        return this.state.updatedAt;
    }


    static create(values: CreatePaymentValues): Payment {
        Payment.validatePaymentValues(values);

        const now = values.now ?? new Date();
        const licensePlate = Payment.validateLicensePlate(values.licensePlate);

        return new Payment({
            id: values.id,
            parkingId: values.parkingId,
            idempotencyKey: values.idempotencyKey,
            licensePlate,
            amountInCents: values.amountInCents,
            currency: values.currency,
            status: PaymentStatus.PENDING,
            paymentProviderReference: null,
            retryCount: 0,
            nextRetryAt: null,
            lastAttemptAt: null,
            createdAt: now,
            updatedAt: now,
            }
        );
    }

    static restore(values: RestorePaymentValues): Payment {
        Payment.validatePaymentValues(values);

        if (!Number.isSafeInteger(values.retryCount) || values.retryCount < 0) {
            throw new InvalidPaymentError('Retry count must be non negative.');
        }

        return new Payment({
            id: values.id,
            parkingId: values.parkingId,
            idempotencyKey: values.idempotencyKey,
            licensePlate: Payment.validateLicensePlate(values.licensePlate,),
            amountInCents: values.amountInCents,
            currency: values.currency,
            status: values.status,
            paymentProviderReference: values.paymentProviderReference,
            retryCount: values.retryCount,
            nextRetryAt: values.nextRetryAt,
            lastAttemptAt: values.lastAttemptAt,
            createdAt: values.createdAt,
            updatedAt: values.updatedAt,
        });
    }


    markPaid(paymentProviderReference: string, timestamp: Date = new Date()): void {
        if (this.state.status !== PaymentStatus.PENDING) {
            throw new InvalidPaymentTransitionError(this.state.status, PaymentStatus.PAID);
        }

        const cleanedReference = paymentProviderReference.trim()

        if (cleanedReference.length === 0) {
            throw new InvalidPaymentError('Payment provider reference must not be empty.');
        }

        this.state.status = PaymentStatus.PAID;
        this.state.paymentProviderReference = cleanedReference;
        this.state.lastAttemptAt = timestamp;
        this.state.nextRetryAt = null;
        this.state.updatedAt = timestamp;
    }


    private static validatePaymentValues(values: CreatePaymentValues | RestorePaymentValues): void {
        if (values.id.trim().length === 0) {
            throw new InvalidPaymentError('Id must not be empty.');
        }

        if (!Number.isSafeInteger(values.parkingId) || values.parkingId <= 0) {
            throw new InvalidPaymentError('ParkingId must be a positive integer.');
        }

        if (values.idempotencyKey.trim().length === 0) {
            throw new InvalidPaymentError('Idempotency key must not be empty.');
        }

        const licensePlate = Payment.validateLicensePlate(values.licensePlate);
        if (licensePlate.length === 0 || licensePlate.length > 10) {
            throw new InvalidPaymentError('License-plate must contain characters between 1 and 10.');
        }

        if (!Number.isSafeInteger(values.amountInCents) || values.amountInCents <= 0) {
            throw new InvalidPaymentError('Amount must be a positive integer.');
        }
    }

    private static validateLicensePlate(licensePlate : string): string {
        return licensePlate.trim().toUpperCase();
    }
}