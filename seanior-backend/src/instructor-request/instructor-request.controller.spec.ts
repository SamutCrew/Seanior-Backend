import { Test, TestingModule } from '@nestjs/testing';
import { InstructorRequestController } from './instructor-request.controller';

describe('InstructorRequestController', () => {
  let controller: InstructorRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstructorRequestController],
    }).compile();

    controller = module.get<InstructorRequestController>(InstructorRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
