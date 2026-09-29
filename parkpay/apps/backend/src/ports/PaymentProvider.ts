export enum PaymentProviderStatus {
    PAID = 'PAID',
    PENDING = 'PENDING',
    DECLINED = 'DECLINED',
    CAPTURED = 'CAPTURED',
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
    providerReference?: string;
    paymentId: string;
}

export interface QueryPaymentStatusResult {
    status: PaymentProviderStatus;
    providerReference?: string;
}

export interface CapturePaymentRequest {
    providerReference: string;
}

export interface CapturePaymentResult {
    status: PaymentProviderStatus;
    providerReference?: string;
}

export interface PaymentProvider {
    execute(request: ExecutePaymentRequest): Promise<ExecutePaymentResult>;
    queryStatus(request: QueryPaymentStatusRequest): Promise<QueryPaymentStatusResult>;
    capture(request: CapturePaymentRequest): Promise<CapturePaymentResult>;
}

