import { Component, OnInit, ViewChild, Input, Output, EventEmitter, ElementRef, AfterViewInit, Renderer, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { animate, trigger, style, keyframes, state, transition } from '@angular/animations';
import { Observable } from 'rxjs/Rx';

const UP_ARROW = 38;
const DOWN_ARROW = 40;
const ENTER = 13;

@Component({
  selector: 'app-dialog-list-filter',
  templateUrl: './dialog-list-filter.component.html',
  styleUrls: ['./dialog-list-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  animations: [
        trigger('openClose', [
            state('in', style({ 'max-height': '500px', display: 'block', opacity: 1 })),
            transition('void => *', animate(400, keyframes([
                style({ transform: 'max-height', 'max-height': 0, offset: 0 }),
                style({ transform: 'max-height', 'max-height': '500px', offset: 1})
            ]))),
            transition('* => void', animate(400, keyframes([
                style({ transform: 'max-height', 'max-height': '500px', offset: 0}),
                style({ transform: 'max-height', 'max-height': 0, offset: 1 })
            ])))
        ]),
        trigger('focusInOut', [
            state('in', style({transform: 'translateX(0) scale(1)'})),
            state('out', style({transform: 'translateX(0) scale(0)', opacity: 0, display: 'none'})),
            transition('out => in', [
                animate('200ms ease', keyframes([
                    style({opacity: 0, transform: 'translateX(0) scale(0)', offset: 0}),
                    style({opacity: 1, transform: 'translateX(0) scale(1)', offset: 1.0})
                ]))
            ]),
            transition('in => out', [
                animate('100ms ease', style({transform: 'translateX(0) scale(0)'}))
            ])
        ]),
        trigger('dropdown', [
            transition(':enter', [
                style({ transition: 'max-height' }),
                animate('200ms ease-in')
            ]),
            transition(':leave', [
                animate('200ms ease-out', style({ 'opacity': 0 }))
            ])
        ])
    ]
})
export class DialogListFilterComponent implements OnInit, AfterViewInit {

    @ViewChild('searchInput') searchField: ElementRef;
    @Input() items;
    @Input() focus: Observable<boolean>;
    @Output() onInput = new EventEmitter();
    @Output() onSelect = new EventEmitter();

    focusState = 'out';
    placeholder = '';
    showItems = false;
    private _input: string;
    public _selectedItem: number = -1;

    constructor(
        private renderer: Renderer,
        private ref: ChangeDetectorRef
    ) { }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.focus.subscribe(v => {
            if (v && this.searchField) {
                this.setFocus();
            } else {
                this.blur();
            }
        });
    }

    set input(value: string) {
        this._input = value;
        this.onInput.emit(value);
    }

    get input(): string {
        return this._input;
    }

    setFocus() {
        this.placeholder = 'search_in_dialogs';
        this.focusState = 'in';
        this.showItems = true;
        this.renderer.invokeElementMethod(this.searchField.nativeElement, 'focus');
        this.input = '';
    }

    blur() {
        this.focusState = 'out';
        this.showItems = false;
        this.input = '';
    }

    select(item) {
        this.onSelect.emit(item);
        this.input = '';
        this.items = [];
    }

    onKeyPress(event: KeyboardEvent) {
        if (!this.items || !this.items.length) {
            this._selectedItem = -1;
        } else if (event.keyCode === UP_ARROW) {
            this._selectedItem = this._selectedItem === 0 ? this.items.length - 1 : this._selectedItem - 1;
            event.stopPropagation();
            event.preventDefault();
        } else if (event.keyCode === DOWN_ARROW) {
            this._selectedItem = this._selectedItem === this.items.length - 1 ? 0 : this._selectedItem + 1;
            event.stopPropagation();
            event.preventDefault();
        } else if (event.keyCode === ENTER && this._selectedItem > -1) {
            this.select(this.items[this._selectedItem]);
            event.stopPropagation();
            event.preventDefault();
        }
    }

    onHover(i: number) {
        this._selectedItem = i;
        this.ref.detectChanges();
    }
}
