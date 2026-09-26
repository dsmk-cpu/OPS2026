import {PaymentStatus} from "../../domain/PaymentStatus.js";

export interface CreatePaymentResult {
    id: string;
    parkingId: number;
    status: PaymentStatus;
    created: boolean;
}