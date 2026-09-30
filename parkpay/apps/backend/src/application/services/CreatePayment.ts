import {PaymentRepository} from "../../ports/PaymentRepository.js";
import {randomUUID} from "node:crypto";
import {CreatePaymentCommand} from "../dto/CreatePaymentCommand.js";
import {CreatePaymentResult} from "../dto/CreatePaymentResult.js";
import {Payment} from "../../domain/Payment.js";
import {Currency} from "../../domain/Currency.js";
import {PaymentConflictError} from "../../errors/PaymentConflictError.js";
import {Logger} from "pino";


type IdGenerator = () => string;
type Clock = () => Date;

export class CreatePayment {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly logger: Logger,
        private readonly generateId: IdGenerator = randomUUID,
        private readonly clock: Clock = () => new Date()
    ){}

    async execute(command: CreatePaymentCommand): Promise<CreatePaymentResult> {
        const existingPayment =
            await this.paymentRepository.findByParkingId(command.parkingId);

        /*
        We check for duplicate payments to ensure idempotency
         */
        if (existingPayment) {
            this.checkIfSamePayment(existingPayment, command);

            this.logger.info({
                paymentId: existingPayment.id,
                parkingId: existingPayment.parkingId,
                status: existingPayment.status,
            }, 'Existing payment returned due to an idempotent request');

            return this.toResult(existingPayment, false);
        }

        const paymentId = this.generateId();

        /*
        The provider idempotency key is tied to the internal payment id
         */
        const payment = Payment.create({
            id: paymentId,
            parkingId: command.parkingId,
            idempotencyKey: `payment:${paymentId}`,
            licensePlate: command.licensePlate,
            amountInCents: command.amountInCents,
            currency: Currency.EUR,
            now: this.clock(),
        });

        await this.paymentRepository.save(payment);

        this.logger.info({
            paymentId: payment.id,
            parkingId: payment.parkingId,
            amountInCents: payment.amountInCents,
            currency: payment.currency,
        }, 'Payment created');

        return this.toResult(payment, true);
    }



    private checkIfSamePayment(existing: Payment, command: CreatePaymentCommand): void {
        const normalizedLicensePlate = command.licensePlate.trim().toUpperCase();
        const sameLicensePlate = existing.licensePlate === normalizedLicensePlate;
        const sameAmountInCents = existing.amountInCents === command.amountInCents;
        const sameCurrency = existing.currency === Currency.EUR;

        if (!sameLicensePlate || !sameAmountInCents || !sameCurrency) {
            throw new PaymentConflictError(command.parkingId);
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