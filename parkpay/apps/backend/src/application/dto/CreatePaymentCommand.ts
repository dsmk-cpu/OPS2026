export interface CreatePaymentCommand {
    parkingId: number;
    licensePlate: string;
    amountInCents: number;
}