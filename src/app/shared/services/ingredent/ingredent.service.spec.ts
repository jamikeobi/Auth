import { TestBed } from '@angular/core/testing';

import { IngredentService } from './ingredent.service';

describe('IngredentService', () => {
  let service: IngredentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IngredentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
