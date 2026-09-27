import {PaymentRepository} from "../../ports/PaymentRepository.js";
import {randomUUID} from "node:crypto";
import {CreatePaymentCommand} from "../dto/CreatePaymentCommand.js";
import {CreatePaymentResult} from "../dto/CreatePaymentResult.js";
import {Payment} from "../../domain/Payment.js";
import {Currency} from "../../domain/Currency.js";
import {PaymentConflictError} from "../../errors/PaymentConflictError.js";


type IdGenerator = () => string;
type Clock = () => Date;

export class CreatePayment {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly generateId: IdGenerator = randomUUID,
        private readonly clock: Clock = () => new Date()
    ){}

    async execute(command: CreatePaymentCommand): Promise<CreatePaymentResult> {
        const paymentId = this.generateId();
        const payment = Payment.create({
            id: paymentId,
            parkingId: command.parkingId,
            idempotencyKey: `parking:${command.parkingId}`,
            licensePlate: command.licensePlate,
            amountInCents: command.amountInCents,
            currency: Currency.EUR,
            now: this.clock()
        });

        const existingPayment = await this.paymentRepository.findByParkingId(command.parkingId);

        if (existingPayment) {
            this.checkIfSamePayment(existingPayment, payment);
            return this.toResult(existingPayment, false)
        }

       await this.paymentRepository.save(payment);

       return this.toResult(payment, true);
    }



    private checkIfSamePayment(existing: Payment, payment: Payment): void {
        const sameLicensePlate = existing.licensePlate === payment.licensePlate;
        const sameAmountInCents = existing.amountInCents === payment.amountInCents;
        const sameCurrency = existing.currency === payment.currency;

        if (!sameLicensePlate || !sameAmountInCents || !sameCurrency) {
            throw new PaymentConflictError(payment.parkingId);
        }
    }


    private toResult(payment: Payment, created: boolean): CreatePaymentResult{
        return {
            id: payment.id,
            parkingId: payment.parkingId,
            status: payment.status,
            created
        };
    }

}