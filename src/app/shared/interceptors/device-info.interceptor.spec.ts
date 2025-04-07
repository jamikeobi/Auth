import { TestBed } from '@angular/core/testing';

import { DeviceInfoInterceptor } from './device-info.interceptor';

describe('DeviceInfoInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      DeviceInfoInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: DeviceInfoInterceptor = TestBed.inject(DeviceInfoInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
