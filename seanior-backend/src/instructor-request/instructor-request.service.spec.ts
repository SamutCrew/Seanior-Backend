import { Test, TestingModule } from '@nestjs/testing';
import { InstructorRequestService } from './instructor-request.service';

describe('InstructorRequestService', () => {
  let service: InstructorRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InstructorRequestService],
    }).compile();

    service = module.get<InstructorRequestService>(InstructorRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
