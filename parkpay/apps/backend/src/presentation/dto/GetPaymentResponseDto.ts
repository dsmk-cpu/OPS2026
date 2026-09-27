import {PaymentStatus} from "../../domain/PaymentStatus.js";

export interface GetPaymentResponseDto {
    status: PaymentStatus;
}