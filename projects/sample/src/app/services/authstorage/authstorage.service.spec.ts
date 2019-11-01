import { TestBed } from '@angular/core/testing';

import { MyState } from './authstorage.service';

describe('AuthstorageService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MyState = TestBed.get(MyState);
    expect(service).toBeTruthy();
  });
});
