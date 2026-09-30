import {PaymentRepository} from "../../ports/PaymentRepository.js";
import {Repository} from "typeorm";
import {Payment} from "../../domain/Payment.js";
import {PaymentEntity} from "./PaymentEntity.js";
import {PaymentMapper} from "./PaymentMapper.js";
import {PaymentStatus} from "../../domain/PaymentStatus.js";

export class PaymentOrmRepository implements PaymentRepository{
    constructor(private readonly repository: Repository<PaymentEntity>){}

    async save(payment: Payment): Promise<void>{
        const entity = PaymentMapper.toEntity(payment);
        await this.repository.save(entity);
    }

    async findById(id: string): Promise<Payment | null> {
        const entity = await this.repository.findOne({
            where: {id},
        });

        return entity ? PaymentMapper.toDomain(entity) : null;
    }

    async findByIdempotencyKey(idempotencyKey: string): Promise<Payment | null> {
        const entity = await this.repository.findOne({
            where: {idempotencyKey}
        });

        return entity ? PaymentMapper.toDomain(entity) : null;

    }

    async findByParkingId(parkingId: number): Promise<Payment | null> {
        const entity = await this.repository.findOne({
            where: {parkingId}
        });

        return entity ? PaymentMapper.toDomain(entity) : null;
    }

    async findByStatus(status: PaymentStatus): Promise<Payment[]> {
        const entities = await this.repository.find({
            where: {status},
        });

        return entities.map(PaymentMapper.toDomain);
    }

    /*
    Returns both PENDING and PAID payments.
    PENDING payments need processing or reconciliation,
    PAID payments still need capture.
     */
    async findDue(now: Date): Promise<Payment[]> {
        const entities = await this.repository
            .createQueryBuilder('payment')
            .where('payment.status IN (:...statuses)', { statuses: [
                    PaymentStatus.PENDING,
                    PaymentStatus.PAID,
                ],
            })
            .andWhere('(payment.nextRetryAt IS NULL OR payment.nextRetryAt <= :now)', { now })
            .getMany();

        return entities.map((entity) =>
            PaymentMapper.toDomain(entity)
        );
    }
}