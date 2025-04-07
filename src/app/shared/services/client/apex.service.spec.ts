import { TestBed } from '@angular/core/testing';

import { ApexService } from './apex.service';

describe('ApexService', () => {
  let service: ApexService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApexService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
