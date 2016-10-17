import { Component, Input, Output, EventEmitter, animate, trigger, style, keyframes, state, transition } from "@angular/core";

import { MenuItem } from "./menu-item";

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
            state("in", style({ 'max-height': "500px", display: "block", opacity: 1 })),
            transition("void => *", animate(400, keyframes([
                style({ transform: 'max-height', 'max-height': 0, offset: 0 }),
                style({ transform: 'max-height', 'max-height': '500px', offset: 1})
            ]))),
            transition("* => void", animate(400, keyframes([
                style({ transform: 'max-height', 'max-height': '500px', offset: 0}),
                style({ transform: 'max-height', 'max-height': 0, offset: 1 })
            ])))
        ])
    ]
})
export class SearchComponent {
    @Input() items;
    @Output() onInput = new EventEmitter();

    _input: string;

    set input(value: string) {
        this._input = value;
        this.onInput.emit(value);
    }

    get input(): string {
        return this._input;
    }
}