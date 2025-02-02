import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryChallanController } from './delivery_challan.controller';

describe('DeliveryChallanController', () => {
  let controller: DeliveryChallanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryChallanController],
    }).compile();

    controller = module.get<DeliveryChallanController>(DeliveryChallanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
