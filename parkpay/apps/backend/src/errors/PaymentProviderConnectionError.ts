export class PaymentProviderConnectionError extends Error {
    constructor(message = 'Payment provider is currently unavailable') {
        super(message);
        this.name = 'PaymentProviderConnectionError';
    }
}