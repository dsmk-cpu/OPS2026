import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {PaymentWorker} from "../../src/application/services/PaymentWorker.js";
import {Logger} from "pino";
import {PaymentWorkerScheduler} from "../../src/infrastructure/worker/PaymentWorkerScheduler.js";

describe('PaymentWorkerScheduler', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('runs the payment worker periodically', async () => {
        const paymentWorker = {
            runOnce: vi.fn().mockResolvedValue(undefined),
        } as unknown as PaymentWorker;

        const logger = {
            error: vi.fn(),
        } as unknown as Logger;

        const scheduler = new PaymentWorkerScheduler(
            paymentWorker,
            logger,
            5_000
        );

        scheduler.start();

        expect(paymentWorker.runOnce).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(5_000);

        expect(paymentWorker.runOnce).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(5_000);

        expect(paymentWorker.runOnce).toHaveBeenCalledTimes(2);

        scheduler.stop();
    });

    it('stops running the payment worker after stop', async () => {
        const paymentWorker = {
            runOnce: vi.fn().mockResolvedValue(undefined),
        } as unknown as PaymentWorker;

        const logger = {
            error: vi.fn(),
        } as unknown as Logger;

        const scheduler = new PaymentWorkerScheduler(
            paymentWorker,
            logger,
            5_000
        );

        scheduler.start();

        await vi.advanceTimersByTimeAsync(5_000);

        expect(paymentWorker.runOnce).toHaveBeenCalledTimes(1);

        scheduler.stop();

        await vi.advanceTimersByTimeAsync(10_000);

        expect(paymentWorker.runOnce).toHaveBeenCalledTimes(1);
    });

    it('logs errors when a worker run fails', async () => {
        const error = new Error('Database unavailable');

        const paymentWorker = {
            runOnce: vi.fn().mockRejectedValue(error),
        } as unknown as PaymentWorker;

        const logger = {
            error: vi.fn(),
        } as unknown as Logger;

        const scheduler = new PaymentWorkerScheduler(
            paymentWorker,
            logger,
            5_000
        );

        scheduler.start();

        await vi.advanceTimersByTimeAsync(5_000);

        expect(logger.error).toHaveBeenCalledOnce();
        expect(logger.error).toHaveBeenCalledWith({ err: error }, 'Payment worker run failed');

        scheduler.stop();
    });
});