import {PaymentEntity} from "./PaymentEntity.js";
import {Payment} from "../../domain/Payment.js";

export class PaymentMapper {
    static toDomain(entity: PaymentEntity): Payment{
        return new Payment(
            entity.id,
            entity.parkingId,
            entity.idempotencyKey,
            entity.licensePlate,
            entity.amountInCents,
            entity.currency,
            entity.status,
            entity.paymentProviderReference,
            entity.retryCount,
            entity.nextRetryAt,
            entity.lastAttemptAt,
            entity.createdAt,
            entity.updatedAt,
        )
    }

    static toEntity(domain: Payment): PaymentEntity{
        const entity = new PaymentEntity()
        entity.id = domain.id
        entity.parkingId = domain.parkingId
        entity.idempotencyKey = domain.idempotencyKey
        entity.licensePlate = domain.licensePlate
        entity.amountInCents = domain.amountInCents
        entity.currency = domain.currency
        entity.status = domain.status
        entity.paymentProviderReference = domain.paymentProviderReference
        entity.retryCount = domain.retryCount
        entity.nextRetryAt = domain.nextRetryAt
        entity.lastAttemptAt = domain.lastAttemptAt
        entity.createdAt = domain.createdAt
        entity.updatedAt = domain.updatedAt

        return entity
    }
}