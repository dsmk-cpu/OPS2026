import {PaymentStatus} from "../../domain/PaymentStatus.js";

export interface GetPaymentResult {
    id: string;
    parkingId: number;
    status: PaymentStatus;
}