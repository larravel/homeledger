import { Test, TestingModule } from '@nestjs/testing';
import { UtilityUsageController } from './utility-usage.controller';

describe('UtilityUsageController', () => {
  let controller: UtilityUsageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UtilityUsageController],
    }).compile();

    controller = module.get<UtilityUsageController>(UtilityUsageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
