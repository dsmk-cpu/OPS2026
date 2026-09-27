import {z} from "zod";

export const CreatePaymentRequestSchema = z.object({
    id: z.number().int().positive(),

    kennzeichen: z.string().trim().min(1).max(10),

    betrag: z.string().regex(/^\d+\.\d{2}$/)
}).strict()

export type CreatePaymentRequestDto = z.infer<typeof CreatePaymentRequestSchema>;


