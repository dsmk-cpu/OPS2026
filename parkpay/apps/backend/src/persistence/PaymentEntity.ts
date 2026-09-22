import {Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn} from "typeorm";
import {PaymentStatus} from "../domain/PaymentStatus.js";
import {Currency} from "../domain/Currency.js";

@Entity('payments')
export class PaymentEntity {

    @PrimaryColumn( {type: 'text'} )
    id!: string;

    @Column( {type: 'integer', unique: true } )
    parkingId!: number;

    @Column( {type: 'text', unique: true } )
    idempotencyKey!: string;

    @Column( {type: "varchar", length: 10} )
    licensePlate!: string;

    @Column( {type: 'integer'} )
    amountInCents!: number;

    @Column( {type: 'simple-enum', enum:Currency } )
    currency!: Currency;

    @Column( {type: 'simple-enum', enum: PaymentStatus } )
    status!: PaymentStatus;

    @Column( {type: 'string', nullable: true} )
    paymentProviderReference!: string | null;

    @Column( {type: 'integer', default: 0} )
    retryCount!: number;

    @Column( {type: 'date', nullable: true} )
    nextRetryAt!: Date | null;

    @Column( {type: 'date', nullable: true} )
    lastAttemptAt!: Date | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}