import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { Bill } from '../bills/bill.entity';
import { RecurringBill } from './recurring-bill.entity';
import { RecurringBillsService } from './recurring-bills.service';

describe('RecurringBillsService', () => {
  let service: RecurringBillsService;

  const recurringRepo = {
    findOne: jest.fn(),
  };

  const billRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringBillsService,
        {
          provide: getRepositoryToken(RecurringBill),
          useValue: recurringRepo,
        },
        {
          provide: getRepositoryToken(Bill),
          useValue: billRepo,
        },
      ],
    }).compile();

    service = module.get<RecurringBillsService>(RecurringBillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws NotFoundException when the recurring bill does not exist', async () => {
    recurringRepo.findOne.mockResolvedValue(null);

    await expect(service.findOneByUser(1, 99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ForbiddenException when the recurring bill belongs to another user', async () => {
    recurringRepo.findOne.mockResolvedValue({
      id: 10,
      userId: 2,
    });

    await expect(service.findOneByUser(1, 10)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns the recurring bill when the user owns it', async () => {
    const recurringBill = {
      id: 10,
      userId: 1,
      title: 'Netflix',
    };

    recurringRepo.findOne.mockResolvedValue(recurringBill);

    await expect(service.findOneByUser(1, 10)).resolves.toEqual(recurringBill);
  });
});
