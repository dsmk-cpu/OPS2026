import { app } from './app.js';
import { AppDataSource } from './config/data-source.js';
import {logger} from "./infrastructure/logging/logger.js";

const port = Number(process.env.PORT ?? 3000);

async function start(): Promise<void> {
    try {
        await AppDataSource.initialize();

        logger.info('Database connection established.');

        app.listen(port, '0.0.0.0', () => {
            logger.info(`ParkPay backend listening on port ${port}`);
        });
    } catch (error) {
        logger.fatal( {err: error}, 'Failed to start ParkPay backend.');
        process.exit(1);
    }
}

void start();