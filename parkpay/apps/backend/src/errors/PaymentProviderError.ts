export class PaymentProviderError extends Error {
    constructor(message = 'Payment provider error'){
        super(message);
        this.name = 'PaymentProviderError';
    }
}