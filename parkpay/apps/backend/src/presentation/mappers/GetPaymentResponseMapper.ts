import {GetPaymentResult} from "../../application/dto/GetPaymentResult.js";
import {GetPaymentResponseDto} from "../dto/GetPaymentResponseDto.js";

export function toGetPaymentResponse(res: GetPaymentResult): GetPaymentResponseDto {
    return {
        status: res.status
    };
}