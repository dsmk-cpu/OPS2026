import {afterEach, beforeEach, describe, expect, it} from "vitest";
import {DataSource} from "typeorm";
import {PaymentOrmRepository} from "../../src/infrastructure/persistence/PaymentOrmRepository.js";
import {PaymentEntity} from "../../src/infrastructure/persistence/PaymentEntity.js";
import {Payment} from "../../src/domain/Payment.js";
import {Currency} from "../../src/domain/Currency.js";

describe('PaymentOrmRepository', () => {
    let dataSource: DataSource;
    let paymentRepository: PaymentOrmRepository;

    beforeEach(async () => {
        dataSource = new DataSource({
            type: 'better-sqlite3',
            database: ':memory:',
            entities: [PaymentEntity],
            synchronize: true,
            logging: false,
        });

        await dataSource.initialize();
        paymentRepository = new PaymentOrmRepository(dataSource.getRepository(PaymentEntity));

        afterEach(async () => {
            await dataSource.destroy();
        })
    });

    it('returns only pending payments that are due', async () => {
        const now = new Date('2026-09-28T10:00:00.000Z');

        const newPayment = Payment.create({
            id: 'new-payment',
            parkingId: 1,
            idempotencyKey: 'parking:1',
            licensePlate: 'DIL-AB-12',
            amountInCents: 1000,
            currency: Currency.EUR,
            now: new Date('2026-09-28T09:00:00.000Z')
        });

        const overduePayment = Payment.create({
            id: 'overdue-payment',
            parkingId: 2,
            idempotencyKey: 'parking:2',
            licensePlate: 'DIL-AA-2',
            amountInCents: 1000,
            currency: Currency.EUR,
            now: new Date('2026-09-28T09:00:00.000Z'),
        });

        overduePayment.registerFailedAttempts(
            new Date('2026-09-28T09:55:00.000Z'),
            new Date('2026-09-28T09:50:00.000Z')
        );

        const futurePayment = Payment.create({
            id: 'future-payment',
            parkingId: 3,
            idempotencyKey: 'parking:3',
            licensePlate: 'DIL-AA-3',
            amountInCents: 1000,
            currency: Currency.EUR,
            now: new Date('2026-09-28T09:00:00.000Z'),
        });

        futurePayment.registerFailedAttempts(
            new Date('2026-09-28T10:05:00.000Z'),
            new Date('2026-09-28T09:59:00.000Z')
        );

        const paidPayment = Payment.create({
            id: 'paid-payment',
            parkingId: 4,
            idempotencyKey: 'parking:4',
            licensePlate: 'DIL-AA-4',
            amountInCents: 1000,
            currency: Currency.EUR,
            now: new Date('2026-09-28T09:00:00.000Z'),
        });

        paidPayment.markPaid(
            'provider-ref-1',
            new Date('2026-09-28T09:30:00.000Z')
        );

        await paymentRepository.save(newPayment);
        await paymentRepository.save(overduePayment);
        await paymentRepository.save(futurePayment);
        await paymentRepository.save(paidPayment);

        const res = await paymentRepository.findPendingDue(now);

        expect(res).toHaveLength(2);
        expect(res.map(payment => payment.id))
            .toEqual(expect.arrayContaining(['new-payment', 'overdue-payment']));
        expect(res.map(payment => payment.id)).not.toContain('future-payment');
        expect(res.map(payment => payment.id)).not.toContain('paid-payment');
    });
});