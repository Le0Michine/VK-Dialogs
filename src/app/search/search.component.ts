import { Component, Input, Output, EventEmitter, animate, trigger, style, keyframes, state, transition, Renderer, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { Observable } from "rxjs/Observable";

import { MenuItem } from "../datamodels";

const UP_ARROW = 38;
const DOWN_ARROW = 40;
const ENTER = 13;

@Component({
    selector: "search-autocomplete",
    templateUrl: "search.component.html",
    styleUrls: [
        "../css/font-style.css",
        "../css/round-buttons.css",
        "../css/color-scheme.css",
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
        ]),
        trigger("focusInOut", [
            state("in", style({transform: "translateX(0) scale(1)"})),
            state("out", style({transform: "translateX(0) scale(0)", opacity: 0, display: "none"})),
            transition("out => in", [
                animate("200ms ease", keyframes([
                    style({opacity: 0, transform: "translateX(0) scale(0)", offset: 0}),
                    style({opacity: 1, transform: "translateX(0) scale(1)", offset: 1.0})
                ]))
            ]),
            transition("in => out", [
                animate("100ms ease", style({transform: "translateX(0) scale(0)"}))
            ])
        ]),
        trigger("dropdown", [
            transition(":enter", [
                style({ transition: "max-height" }),
                animate("200ms ease-in")
            ]),
            transition(":leave", [
                animate("200ms ease-out", style({ "opacity": 0 }))
            ])
        ])
    ]
})
export class SearchComponent implements AfterViewInit {
    @ViewChild("searchInput") searchField: ElementRef;
    @Input() items;
    @Input() focus: Observable<boolean>;
    @Output() onInput = new EventEmitter();
    @Output() onSelect = new EventEmitter();

    focusState: string = "out";
    placeholder: string = "";
    showItems: boolean = false;
    private _input: string;
    private _selectedItem: number = -1;

    constructor(private renderer: Renderer) { }

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
        this.placeholder = "search_in_dialogs";
        this.focusState = "in";
        this.showItems = true;
        this.renderer.invokeElementMethod(this.searchField.nativeElement, "focus");
    }

    blur() {
        this.focusState = "out";
        this.placeholder = "empty";
        this.showItems = false;
        this.input = "";
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