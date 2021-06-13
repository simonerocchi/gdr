import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginCompoentComponent } from './login-compoent.component';

describe('LoginCompoentComponent', () => {
  let component: LoginCompoentComponent;
  let fixture: ComponentFixture<LoginCompoentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginCompoentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginCompoentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
