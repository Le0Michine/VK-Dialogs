import { Component, Input, Output, EventEmitter, animate, trigger, style, keyframes, state, transition } from "@angular/core";

import { MenuItem } from "./menu-item";

@Component({
    selector: "popup-menu",
    templateUrl: "popup-menu.component.html",
    styleUrls: [ "popup-menu.component.css" ],
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
export class PopupMenuComponent {
    _state: string = "out";

    @Output() onSelect: EventEmitter<number> = new EventEmitter();
    @Output() onRemove: EventEmitter<number> = new EventEmitter();

    @Input() menuItems: MenuItem[];
    @Input() deletable: boolean;
    @Input() selectable: boolean;

    @Input("state")
    set state(value) {
        this._state = Boolean(value) ? "in" : "out";
    }

    get state(): string {
        return this._state;
    }

    ngOnInit() {
    }

    select(value: number): void {
        this.onSelect.emit(value);
    }

    remove(value: number): void {
        this.onRemove.emit(value);
    }
}