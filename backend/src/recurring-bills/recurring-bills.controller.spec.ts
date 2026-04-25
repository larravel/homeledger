import { Test, TestingModule } from '@nestjs/testing';
import { RecurringBillsController } from './recurring-bills.controller';

describe('RecurringBillsController', () => {
  let controller: RecurringBillsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringBillsController],
    }).compile();

    controller = module.get<RecurringBillsController>(RecurringBillsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
