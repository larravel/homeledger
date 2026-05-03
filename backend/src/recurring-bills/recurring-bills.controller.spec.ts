import { Test, TestingModule } from '@nestjs/testing';

import { RecurringBillsController } from './recurring-bills.controller';
import { RecurringBillsService } from './recurring-bills.service';

describe('RecurringBillsController', () => {
  let controller: RecurringBillsController;

  const recurringBillsService = {
    findAll: jest.fn(),
    generateBills: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringBillsController],
      providers: [
        {
          provide: RecurringBillsService,
          useValue: recurringBillsService,
        },
      ],
    }).compile();

    controller = module.get<RecurringBillsController>(RecurringBillsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates findAll using the authenticated user id', async () => {
    const req = {
      user: { userId: 7, email: 'user@example.com' },
    } as any;

    recurringBillsService.findAll.mockResolvedValue([{ id: 1 }]);

    await expect(controller.findAll(req)).resolves.toEqual([{ id: 1 }]);
    expect(recurringBillsService.findAll).toHaveBeenCalledWith(7);
  });

  it('delegates generateBills using the authenticated user id', async () => {
    const req = {
      user: { userId: 9, email: 'user@example.com' },
    } as any;

    recurringBillsService.generateBills.mockResolvedValue({ generated: 2 });

    await expect(controller.generateBills(req)).resolves.toEqual({ generated: 2 });
    expect(recurringBillsService.generateBills).toHaveBeenCalledWith(9);
  });
});
