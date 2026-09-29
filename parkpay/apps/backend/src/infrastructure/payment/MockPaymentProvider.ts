import {
    CapturePaymentRequest, CapturePaymentResult,
    ExecutePaymentRequest,
    ExecutePaymentResult,
    PaymentProvider,
    PaymentProviderStatus,
    QueryPaymentStatusRequest,
    QueryPaymentStatusResult
} from "../../ports/PaymentProvider.js";
import {PaymentProviderConnectionError} from "../../errors/PaymentProviderConnectionError.js";
import {PaymentProviderError} from "../../errors/PaymentProviderError.js";
import {PaymentProviderUncertainOutcomeError} from "../../errors/PaymentProviderUncertainOutcomeError.js";


export enum MockPaymentProviderMode {
    ONLINE_SUCCESS = 'ONLINE_SUCCESS',
    OFFLINE = 'OFFLINE',
    TIMEOUT_AFTER_PROCESSING = 'TIMEOUT_AFTER_PROCESSING',
    DECLINED = 'DECLINED',
    PENDING = 'PENDING',
    PROVIDER_ERROR = 'PROVIDER_ERROR',
}


export class MockPaymentProvider implements PaymentProvider {
    private readonly processedPayments = new Map<string, QueryPaymentStatusResult>();

    constructor(private readonly mode: MockPaymentProviderMode) {
    }

    async execute(request: ExecutePaymentRequest): Promise<ExecutePaymentResult>{
        switch(this.mode){
            case MockPaymentProviderMode.ONLINE_SUCCESS:
                const result: ExecutePaymentResult = {
                    status: PaymentProviderStatus.PAID,
                    providerReference: `mock:${request.paymentId}`
                };

                this.processedPayments.set(request.idempotencyKey, result);
                return result;

            case MockPaymentProviderMode.DECLINED:
                return {
                    status: PaymentProviderStatus.DECLINED,
                };

            case MockPaymentProviderMode.PENDING:
                return {
                    status: PaymentProviderStatus.PENDING,
                };

            case MockPaymentProviderMode.OFFLINE:
                throw new PaymentProviderConnectionError('Mock provider is offline');

            case MockPaymentProviderMode.TIMEOUT_AFTER_PROCESSING:
                const res: ExecutePaymentResult = {
                    status: PaymentProviderStatus.PAID,
                    providerReference: `mock:${request.paymentId}`
                };
                this.processedPayments.set(request.idempotencyKey, res);
                throw new PaymentProviderUncertainOutcomeError('Connection lost after payment processing');

            case MockPaymentProviderMode.PROVIDER_ERROR:
                throw new PaymentProviderError('Mock provider error');
        }
    }
    async queryStatus(request: QueryPaymentStatusRequest): Promise<QueryPaymentStatusResult> {
        if (this.mode === MockPaymentProviderMode.OFFLINE) {
            throw new PaymentProviderConnectionError('Mock provider is offline');
        }

        return this.processedPayments.get(request.idempotencyKey) ?? {
            status: PaymentProviderStatus.PENDING
        };
    }

    async capture(request: CapturePaymentRequest): Promise<CapturePaymentResult> {
        switch (this.mode) {
            case MockPaymentProviderMode.ONLINE_SUCCESS:
                return {
                    status: PaymentProviderStatus.CAPTURED,
                    providerReference: request.providerReference,
                };

            case MockPaymentProviderMode.OFFLINE:
                throw new PaymentProviderConnectionError(
                    "Mock payment provider is offline"
                );

            case MockPaymentProviderMode.PROVIDER_ERROR:
                throw new PaymentProviderError(
                    "Mock payment provider error"
                );

            default:
                return {
                    status: PaymentProviderStatus.PENDING,
                    providerReference: request.providerReference,
                };
        }
    }
}