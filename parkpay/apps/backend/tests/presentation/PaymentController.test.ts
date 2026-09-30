import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {Request, Response} from 'express';

import {PaymentController} from '../../src/presentation/controllers/PaymentController.js';
import {CreatePayment} from '../../src/application/services/CreatePayment.js';
import {PaymentStatus} from '../../src/domain/PaymentStatus.js';
import {Payment} from "../../src/domain/Payment.js";
import {Currency} from "../../src/domain/Currency.js";
import {PaymentRepository} from "../../src/ports/PaymentRepository.js";
import {RequestValidationError} from "../../src/errors/RequestValidationError.js";
import {GetPayment} from "../../src/application/services/GetPayment.js";
import {PaymentNotFoundError} from "../../src/errors/PaymentNotFoundError.js";


function createRepositoryMock() {
    return {
        save: vi.fn<PaymentRepository['save']>(),
        findById: vi.fn<PaymentRepository['findById']>(),
        findByIdempotencyKey: vi.fn<PaymentRepository['findByIdempotencyKey']>(),
        findByParkingId: vi.fn<PaymentRepository['findByParkingId']>(),
        findByStatus: vi.fn<PaymentRepository['findByStatus']>(),
        findDue: vi.fn<PaymentRepository['findDue']>(),
    };
}

const logger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
} as any;


function createResponseMock() {
    const status = vi.fn();
    const json = vi.fn();

    const res = {
        status,
        json,
    } as unknown as Response;

    status.mockReturnValue(res);

    return { res, status, json };
}

describe('PaymentController', () => {
    let repository: ReturnType<typeof createRepositoryMock>;
    let createPayment: CreatePayment;
    let getPayment: GetPayment;
    let controller: PaymentController;

    beforeEach(() => {
        repository = createRepositoryMock();

        createPayment = new CreatePayment(
            repository,
            logger,
            () => 'payment1',
            () => new Date('2026-09-27T10:00:00.000Z'),
        );

        getPayment = new GetPayment(repository);

        controller = new PaymentController(createPayment, getPayment);
    });

    it('creates a payment and returns 201', async () => {
        repository.findByParkingId.mockResolvedValue(null);

        const req = {
            body: {
                id: 123,
                kennzeichen: 'DIL AB 123',
                betrag: '12.50',
            },
        } as Request;

        const { res, status, json } = createResponseMock();

        await controller.create(req, res);

        expect(repository.save).toHaveBeenCalledOnce();

        expect(status).toHaveBeenCalledWith(201);

        expect(json).toHaveBeenCalledWith({
            id: 'payment1',
            parkingId: 123,
            status: PaymentStatus.PENDING,
        });
    });

    it('returns 200 when payment already exists', async () => {
        const existingPayment = Payment.create({
            id: 'existing1',
            parkingId: 123,
            idempotencyKey: 'parking:123',
            licensePlate: 'DIL AB 123',
            amountInCents: 1250,
            currency: Currency.EUR,
        });

        repository.findByParkingId.mockResolvedValue(
            existingPayment
        );

        const req = {
            body: {
                id: 123,
                kennzeichen: 'DIL AB 123',
                betrag: '12.50',
            },
        } as Request;

        const { res, status, json } = createResponseMock();

        await controller.create(req, res);

        expect(repository.save).not.toHaveBeenCalled();

        expect(status).toHaveBeenCalledWith(200);

        expect(json).toHaveBeenCalledWith({
            id: 'existing1',
            parkingId: 123,
            status: PaymentStatus.PENDING,
        });
    });

    it('throws RequestValidationError for invalid request', async () => {
        const req = {
            body: {
                id: -1,
                kennzeichen: '',
                betrag: 'invalid',
            },
        } as Request;

        const { res } = createResponseMock();

        await expect(
            controller.create(req, res)
        ).rejects.toBeInstanceOf(RequestValidationError);

        expect(repository.findByParkingId).not.toHaveBeenCalled();
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('returns payment status with 200', async () => {
        const existingPayment = Payment.create({
            id: 'payment1',
            parkingId: 123,
            idempotencyKey: 'parking:123',
            licensePlate: 'DIL AB 123',
            amountInCents: 1250,
            currency: Currency.EUR,
        });

        repository.findByParkingId.mockResolvedValue(
            existingPayment
        );

        const req = {
            params: {
                id: '123',
            },
        } as unknown as Request;

        const status = vi.fn();
        const json = vi.fn();

        const res = {
            status,
            json,
        } as unknown as Response;

        status.mockReturnValue(res);

        await controller.get(req, res);

        expect(repository.findByParkingId)
            .toHaveBeenCalledWith(123);

        expect(status).toHaveBeenCalledWith(200);

        expect(json).toHaveBeenCalledWith({
            status: PaymentStatus.PENDING,
        });
    });

    it('throws PaymentNotFoundError when payment does not exist', async () => {
        repository.findByParkingId.mockResolvedValue(null);

        const req = {
            params: {
                id: '999',
            },
        } as unknown as Request;

        const res = {} as Response;

        await expect(
            controller.get(req, res)
        ).rejects.toBeInstanceOf(PaymentNotFoundError);

        expect(repository.findByParkingId)
            .toHaveBeenCalledWith(999);
    });

    it('throws RequestValidationError for invalid parking id', async () => {
        const req = {
            params: {
                id: 'abc',
            },
        } as unknown as Request;

        const res = {} as Response;

        await expect(
            controller.get(req, res)
        ).rejects.toBeInstanceOf(RequestValidationError);

        expect(repository.findByParkingId)
            .not.toHaveBeenCalled();
    });
});