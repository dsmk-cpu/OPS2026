import { app } from './app.js';
import { AppDataSource } from './config/data-source.js';

const port = Number(process.env.PORT ?? 3000);

async function start(): Promise<void> {
    try {
        await AppDataSource.initialize();

        console.log('Database connection established.');

        app.listen(port, '0.0.0.0', () => {
            console.log(`ParkPay backend listening on port ${port}`);
        });
    } catch (error) {
        console.error(
            'Failed to start ParkPay backend.',
            error
        );

        process.exit(1);
    }
}

void start();