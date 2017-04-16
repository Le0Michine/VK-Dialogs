import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxComponent {
  @Input() label: string;
  @Input() value: boolean;
  @Output() valueChange: EventEmitter<boolean> = new EventEmitter();

  public onClick(): void {
    this.valueChange.emit(!this.value);
  }
}
