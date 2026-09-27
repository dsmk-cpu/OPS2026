import {PaymentStatus} from "../../domain/PaymentStatus.js";

export interface CreatePaymentResponseDto {
    id: string,
    parkingId: number,
    status: PaymentStatus,
}