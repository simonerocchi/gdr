import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserCompoentComponent } from './add-user-compoent.component';

describe('AddUserCompoentComponent', () => {
  let component: AddUserCompoentComponent;
  let fixture: ComponentFixture<AddUserCompoentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddUserCompoentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddUserCompoentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
