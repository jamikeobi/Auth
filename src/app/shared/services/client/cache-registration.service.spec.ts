import { TestBed } from '@angular/core/testing';

import { CacheRegistrationService } from './cache-registration.service';

describe('CacheRegistrationService', () => {
  let service: CacheRegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheRegistrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
