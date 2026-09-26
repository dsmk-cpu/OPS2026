export class PaymentNotFoundError extends Error {
    constructor(public readonly parkingId: number) {
        super('Payment for parking id {$parkingId} not found.');
        this.name = 'PaymentNotFoundError';
    }
}