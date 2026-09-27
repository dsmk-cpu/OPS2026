import type { z } from "zod";


export class RequestValidationError extends Error {
    constructor(public readonly issues: z.ZodError['issues']) {
        super('Invalid request.');
        this.name = 'RequestValidationError';
    }
}