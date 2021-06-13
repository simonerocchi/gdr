import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessaggioComponentComponent } from './messaggio-component.component';

describe('MessaggioComponentComponent', () => {
  let component: MessaggioComponentComponent;
  let fixture: ComponentFixture<MessaggioComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessaggioComponentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessaggioComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
