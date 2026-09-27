export enum PaymentProviderStatus {
    PAID = 'PAID',
    PENDING = 'PENDING',
    DECLINED = 'DECLINED',
}

export interface ExecutePaymentRequest {
    paymentId: string,
    amountInCents: number,
    currency: string,
    idempotencyKey: string
}

export interface ExecutePaymentResult {
    status: PaymentProviderStatus;
    providerReference?: string;
}

export interface QueryPaymentStatusRequest {
    idempotencyKey: string;
}

export interface QueryPaymentStatusResult {
    status: PaymentProviderStatus;
    providerReference?: string;
}

export interface PaymentProvider {
    execute(request: ExecutePaymentRequest): Promise<ExecutePaymentResult>;
    queryStatus(request: QueryPaymentStatusRequest): Promise<QueryPaymentStatusResult>;
}

