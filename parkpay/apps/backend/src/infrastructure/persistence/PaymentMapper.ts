import {PaymentEntity} from "./PaymentEntity.js";
import {Payment} from "../../domain/Payment.js";

export class PaymentMapper {
    static toDomain(entity: PaymentEntity): Payment{
        return Payment.restore({
            id: entity.id,
            parkingId: entity.parkingId,
            idempotencyKey: entity.idempotencyKey,
            licensePlate: entity.licensePlate,
            amountInCents: entity.amountInCents,
            currency: entity.currency,
            status: entity.status,
            paymentProviderReference:
            entity.paymentProviderReference,
            retryCount: entity.retryCount,
            nextRetryAt: entity.nextRetryAt,
            lastAttemptAt: entity.lastAttemptAt,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        })
    }

    static toEntity(domain: Payment): PaymentEntity{
        const entity = new PaymentEntity()

        entity.id = domain.id;
        entity.parkingId = domain.parkingId;
        entity.idempotencyKey = domain.idempotencyKey;
        entity.licensePlate = domain.licensePlate;
        entity.amountInCents = domain.amountInCents;
        entity.currency = domain.currency;
        entity.status = domain.status;
        entity.paymentProviderReference = domain.paymentProviderReference;
        entity.retryCount = domain.retryCount;
        entity.nextRetryAt = domain.nextRetryAt;
        entity.lastAttemptAt = domain.lastAttemptAt;
        entity.createdAt = domain.createdAt;
        entity.updatedAt = domain.updatedAt;

        return entity;
    }
}