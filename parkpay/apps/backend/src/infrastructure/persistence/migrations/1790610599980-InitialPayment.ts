import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialPayment1790610599980 implements MigrationInterface {
    name = 'InitialPayment1790610599980'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_payments" ("id" text PRIMARY KEY NOT NULL, "parkingId" integer NOT NULL, "idempotencyKey" text NOT NULL, "licensePlate" varchar(10) NOT NULL, "amountInCents" integer NOT NULL, "currency" varchar CHECK( "currency" IN ('EUR') ) NOT NULL, "status" varchar CHECK( "status" IN ('PAID','CAPTURED','PENDING','CANCELED') ) NOT NULL, "paymentProviderReference" text, "retryCount" integer NOT NULL DEFAULT (0), "nextRetryAt" datetime, "lastAttemptAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "requiresReconciliation" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_743b9fb1d2a059f2f7860418e4e" UNIQUE ("idempotencyKey"), CONSTRAINT "UQ_2e118b54709327336bd9da262af" UNIQUE ("parkingId"))`);
        await queryRunner.query(`INSERT INTO "temporary_payments"("id", "parkingId", "idempotencyKey", "licensePlate", "amountInCents", "currency", "status", "paymentProviderReference", "retryCount", "nextRetryAt", "lastAttemptAt", "createdAt", "updatedAt") SELECT "id", "parkingId", "idempotencyKey", "licensePlate", "amountInCents", "currency", "status", "paymentProviderReference", "retryCount", "nextRetryAt", "lastAttemptAt", "createdAt", "updatedAt" FROM "payments"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`ALTER TABLE "temporary_payments" RENAME TO "payments"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" RENAME TO "temporary_payments"`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" text PRIMARY KEY NOT NULL, "parkingId" integer NOT NULL, "idempotencyKey" text NOT NULL, "licensePlate" varchar(10) NOT NULL, "amountInCents" integer NOT NULL, "currency" varchar CHECK( "currency" IN ('EUR') ) NOT NULL, "status" varchar CHECK( "status" IN ('PAID','CAPTURED','PENDING','CANCELED') ) NOT NULL, "paymentProviderReference" text, "retryCount" integer NOT NULL DEFAULT (0), "nextRetryAt" datetime, "lastAttemptAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_743b9fb1d2a059f2f7860418e4e" UNIQUE ("idempotencyKey"), CONSTRAINT "UQ_2e118b54709327336bd9da262af" UNIQUE ("parkingId"))`);
        await queryRunner.query(`INSERT INTO "payments"("id", "parkingId", "idempotencyKey", "licensePlate", "amountInCents", "currency", "status", "paymentProviderReference", "retryCount", "nextRetryAt", "lastAttemptAt", "createdAt", "updatedAt") SELECT "id", "parkingId", "idempotencyKey", "licensePlate", "amountInCents", "currency", "status", "paymentProviderReference", "retryCount", "nextRetryAt", "lastAttemptAt", "createdAt", "updatedAt" FROM "temporary_payments"`);
        await queryRunner.query(`DROP TABLE "temporary_payments"`);
    }

}
