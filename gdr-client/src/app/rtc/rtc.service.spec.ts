import { TestBed } from '@angular/core/testing';

import { RTCService } from './rtc.service';

describe('RTCService', () => {
  let service: RTCService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RTCService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
