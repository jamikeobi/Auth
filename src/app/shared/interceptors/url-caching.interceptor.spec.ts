import { TestBed } from '@angular/core/testing';

import { UrlCachingInterceptor } from './url-caching.interceptor';

describe('UrlCachingInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      UrlCachingInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: UrlCachingInterceptor = TestBed.inject(UrlCachingInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
