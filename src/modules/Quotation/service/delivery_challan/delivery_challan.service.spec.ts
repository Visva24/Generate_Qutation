import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryChallanService } from './delivery_challan.service';

describe('DeliveryChallanService', () => {
  let service: DeliveryChallanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeliveryChallanService],
    }).compile();

    service = module.get<DeliveryChallanService>(DeliveryChallanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
