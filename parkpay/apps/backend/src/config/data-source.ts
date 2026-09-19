import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
    type: 'better-sqlite3',

    database:
        process.env.DATABASE_PATH ??
        './data/parkpay.sqlite',

    entities: [],

    synchronize: false,
    logging: false,
});