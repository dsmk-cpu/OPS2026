import {CreatePaymentResult} from "../../application/dto/CreatePaymentResult.js";
import {CreatePaymentResponseDto} from "../dto/CreatePaymentResponseDto.js";

export function toCreatePaymentResponse(res: CreatePaymentResult): CreatePaymentResponseDto {
    return {
        id: res.id,
        parkingId: res.parkingId,
        status: res.status,
    }
}