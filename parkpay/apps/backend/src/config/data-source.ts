import 'reflect-metadata';
import { DataSource } from 'typeorm';
import {PaymentEntity} from "../infrastructure/persistence/PaymentEntity.js";

export const AppDataSource = new DataSource({
    type: 'better-sqlite3',

    database:
        process.env.DATABASE_PATH ??
        './data/parkpay.sqlite',

    entities: [PaymentEntity],

    migrations: ['./dist/src/infrastructure/persistence/migrations/*.js'],

    synchronize: false,
    logging: false,
});