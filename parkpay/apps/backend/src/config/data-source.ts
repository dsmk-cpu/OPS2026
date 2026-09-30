import 'reflect-metadata';
import { DataSource } from 'typeorm';
import {PaymentEntity} from "../infrastructure/persistence/PaymentEntity.js";

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
    type: 'better-sqlite3',

    database:
        process.env.DATABASE_PATH ??
        './data/parkpay.sqlite',

    entities: [PaymentEntity],

    migrations: [
        isProduction
            ? './dist/src/infrastructure/persistence/migrations/*.js'
            : './src/infrastructure/persistence/migrations/*.ts',
    ],

    synchronize: false,
    logging: false,
});
