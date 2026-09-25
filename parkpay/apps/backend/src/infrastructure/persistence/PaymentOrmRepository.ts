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

    async findByParkingID(parkingId: number): Promise<Payment | null> {
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
}