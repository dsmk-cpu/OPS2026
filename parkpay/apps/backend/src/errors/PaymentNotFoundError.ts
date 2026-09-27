export class PaymentNotFoundError extends Error {
    constructor(identifier: string | number, identifierType: 'paymentId' | 'parkingId') {
        super(`Payment ${identifierType} ${identifier} not found`);
        this.name = 'PaymentNotFoundError';
    }
}