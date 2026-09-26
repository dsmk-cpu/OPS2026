import {PaymentRepository} from "../../ports/PaymentRepository.js";
import {PaymentNotFoundError} from "../../errors/PaymentNotFoundError.js";
import {GetPaymentResult} from "../dto/GetPaymentResult.js";

export class GetPayment {
    constructor(
        public readonly paymentRepository: PaymentRepository,
    ){}

    async execute(parkingId: number): Promise<GetPaymentResult> {
        const payment = await this.paymentRepository.findByParkingId(parkingId);

        if (!payment){
            throw new PaymentNotFoundError(parkingId);
        }

        return {
            id: payment.id,
            parkingId: payment.parkingId,
            status: payment.status,
        };
    }
}