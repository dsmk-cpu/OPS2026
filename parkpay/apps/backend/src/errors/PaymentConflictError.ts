export class PaymentConflictError extends Error {
    constructor(public readonly parkingId: number){
        super(`A different payment already exists for the parkingId ${parkingId}`);
        this.name = 'PaymentConflictError';
    }
}