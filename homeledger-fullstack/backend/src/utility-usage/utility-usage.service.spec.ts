import { Test, TestingModule } from '@nestjs/testing';
import { UtilityUsageService } from './utility-usage.service';

describe('UtilityUsageService', () => {
  let service: UtilityUsageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UtilityUsageService],
    }).compile();

    service = module.get<UtilityUsageService>(UtilityUsageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
