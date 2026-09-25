import {Payment} from "../domain/Payment.js";
import {PaymentStatus} from "../domain/PaymentStatus.js";

export interface PaymentRepository {
    save(payment: Payment): Promise<void>
    findById(id: string): Promise<Payment| null>
    findByIdempotencyKey(idempotencyKey: string): Promise<Payment | null>
    findByParkingId(parkingId: number): Promise<Payment | null>
    findByStatus(status: PaymentStatus): Promise<Payment[]>
}