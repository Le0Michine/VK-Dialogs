import { Component, Input, Output, EventEmitter, animate, trigger, style, keyframes, state, transition, Renderer, ViewChild, ElementRef, AfterViewInit } from "@angular/core";

import { MenuItem } from "./menu-item";

const UP_ARROW = 38;
const DOWN_ARROW = 40;
const ENTER = 13;

@Component({
    selector: "search-autocomplete",
    templateUrl: "search.component.html",
    styleUrls: [
        "css/font-style.css",
        "css/round-buttons.css",
        "css/color-scheme.css",
        "search.component.css"
    ],
    animations: [
        trigger("openClose", [
            state("in", style({ "max-height": "500px", display: "block", opacity: 1 })),
            transition("void => *", animate(400, keyframes([
                style({ transform: "max-height", "max-height": 0, offset: 0 }),
                style({ transform: "max-height", "max-height": "500px", offset: 1})
            ]))),
            transition("* => void", animate(400, keyframes([
                style({ transform: "max-height", "max-height": "500px", offset: 0}),
                style({ transform: "max-height", "max-height": 0, offset: 1 })
            ])))
        ])
    ]
})
export class SearchComponent implements AfterViewInit {
    @ViewChild("searchInput") searchField: ElementRef;
    @Input() items;
    @Input() focus;
    @Output() onInput = new EventEmitter();
    @Output() onSelect = new EventEmitter();

    show: boolean = false;
    private _input: string;
    private _selectedItem: number = -1;

    constructor(private renderer: Renderer) { }

    ngAfterViewInit() {
        this.focus.subscribe(v => {
            if (v && this.searchField) {
                this.show = true;
                setTimeout(() => this.renderer.invokeElementMethod(this.searchField.nativeElement, "focus"), 0);
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

    select(item) {
        this.onSelect.emit(item);
        this.input = "";
        this.items = [];
    }

    onKeyPress(event: KeyboardEvent) {
        if (!this.items || !this.items.length) {
            this._selectedItem = -1;
        }
        else if (event.keyCode === UP_ARROW) {
            this._selectedItem = this._selectedItem === 0 ? this.items.length - 1 : this._selectedItem - 1;
            event.stopPropagation();
            event.preventDefault();
        }
        else if (event.keyCode === DOWN_ARROW) {
            this._selectedItem = this._selectedItem === this.items.length - 1 ? 0 : this._selectedItem + 1;
            event.stopPropagation();
            event.preventDefault();
        }
        else if (event.keyCode === ENTER && this._selectedItem > -1) {
            this.select(this.items[this._selectedItem]);
            event.stopPropagation();
            event.preventDefault();
        }
    }

    onHover(i: number) {
        this._selectedItem = i;
    }
}