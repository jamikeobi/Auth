import { TestBed } from '@angular/core/testing';

import { SockResolver } from './sock.resolver';

describe('SockResolver', () => {
  let resolver: SockResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(SockResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
