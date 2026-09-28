import { PaymentProviderConnectionError } from './PaymentProviderConnectionError.js';

export class PaymentProviderUncertainOutcomeError
    extends PaymentProviderConnectionError {
    constructor(
        message = 'Payment outcome is uncertain'
    ) {
        super(message);
        this.name = 'PaymentProviderUncertainOutcomeError';
    }
}