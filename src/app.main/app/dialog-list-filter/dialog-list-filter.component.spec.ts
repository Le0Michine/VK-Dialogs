import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogListFilterComponent } from './dialog-list-filter.component';

describe('DialogListFilterComponent', () => {
  let component: DialogListFilterComponent;
  let fixture: ComponentFixture<DialogListFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogListFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogListFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
