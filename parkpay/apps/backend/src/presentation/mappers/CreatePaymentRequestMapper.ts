import {CreatePaymentRequestDto} from "../schemas/CreatePaymentRequestSchema.js";
import {CreatePaymentCommand} from "../../application/dto/CreatePaymentCommand.js";

export function toCreatePaymentCommand(dto: CreatePaymentRequestDto): CreatePaymentCommand {
    const [euros, cents] = dto.betrag.split('.');

    return {
        parkingId: dto.id,
        licensePlate: dto.kennzeichen,
        amountInCents: Number(euros) * 100 + Number(cents)
    };
}