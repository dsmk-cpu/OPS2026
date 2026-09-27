import {z} from "zod";

export const GetPaymentParameterSchema = z.object({
    id: z.coerce.number().int().positive()
});

export type GetPaymentParametersDto = z.infer<typeof GetPaymentParameterSchema>;