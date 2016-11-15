import { Component, EventEmitter, Output, Input, ChangeDetectorRef } from "@angular/core";
import { trigger, state, transition, style, animate, keyframes } from "@angular/core";
import { Observable } from "rxjs/Observable";

// const animationCurve = "cubic-bezier(0.68, -0.55, 0.265, 1.55)";

@Component({
    selector: "emoji",
    templateUrl: "emoji.component.html",
    styleUrls: [ "emoji.component.css" ],
    animations: [
        trigger("toggleEmoji", [
            state("in", style({height: "210px", opacity: 1})),
            state("out", style({height: "0", opacity: 0, display: "none"})),
            transition("out => in", [
                animate(200, keyframes([
                    style({transform: "height", opacity: 0, height: "0", offset: 0}),
                    style({transform: "height", opacity: 1, height: "210px", offset: 1.0})
                ]))
            ]),
            transition("in => out", [
                animate(200, keyframes([
                    style({transform: "height", opacity: 1, height: "210px", offset: 0}),
                    style({transform: "height", opacity: 0, height: "0", offset: 1.0})
                ]))
            ]),
            transition("void => *", [
                animate(0, style({height: "0", opacity: 0, display: "none"}))
            ])
        ]),
        trigger("slidePage", [
            state("in", style({transform: "translateX(0)", opacity: 1})),
            state("out_r", style({transform: "translateX(100%)", opacity: 0, display: "none"})),
            state("out_l", style({transform: "translateX(-100%)", opacity: 0, display: "none"})),
            transition("* => *", [
                animate(100)
            ])
        ])
    ]
})
export class EmojiComponent {
    @Input() emojiPanelPosition: number;
    @Input() toggle: Observable<boolean>;
    @Output() onSelect = new EventEmitter<string>();

    emojiCodePoints = [];
    currentTab: HTMLButtonElement = null;
    emojiPanelState: string = "out";
    canToggle: boolean = false;

    states = [
        {page: "smiles",   state: "in"},
        {page: "animals",  state: "out_r"},
        {page: "food",     state: "out_r"},
        {page: "activity", state: "out_r"},
        {page: "travel",   state: "out_r"},
        {page: "objects",  state: "out_r"},
        {page: "symbols",  state: "out_r"},
        {page: "flags",    state: "out_r"},
    ];

    constructor(private changeDetector: ChangeDetectorRef) {
    }

    ngOnInit() {
        let emojiWrapper = document.getElementById("emoji_wrapper");
        for (let i = 0; i < emojiWrapper.children.length; i++) {
            emojiWrapper.children[i].innerHTML = twemoji.parse(emojiWrapper.children[i].innerHTML);
        }
        let emojiImgs = document.getElementsByClassName("emoji");
        for (let i = 0; i < emojiImgs.length; i++) {
            let emojiImg = emojiImgs.item(i) as HTMLImageElement;
            if (emojiImg) {
                emojiImg.onclick = () => this.selectEmoji(emojiImg.alt);
            }
        }
        let flagsImg = document.getElementById("flags").getElementsByTagName("img");
        for (let i = 0; i < flagsImg.length; i++) {
            flagsImg.item(i).setAttribute("title", countries[flagsImg.item(i).alt]);
        }

        this.toggle.subscribe(value => {
            this.toggleEmojiPanel();
        });

        setTimeout(() => this.canToggle = true, 500);
    }

    toggleEmojiPanel() {
        if (this.canToggle) {
            this.emojiPanelState = this.emojiPanelState === "out" ? "in" : "out";
            this.canToggle = false;
            setTimeout(() => this.canToggle = true, 500);
        }
    }

    selectEmoji(emojiCodePoint) {
        this.onSelect.emit(emojiCodePoint);
    }

    selectTab(page: string) {
        let currentPage = this.states.findIndex(x => x.state === "in");
        let newPage = this.states.findIndex(x => x.page === page);
        if (currentPage > newPage) {
            for (let i = currentPage; i > newPage; i--) {
                this.states[i].state = "out_r";
            }
        }
        else {
            for (let i = currentPage; i < newPage; i++) {
                this.states[i].state = "out_l";
            }
        }
        this.states[newPage].state = "in";
    }

    isSelected(page: string) {
        return this.getState(page) === "in";
    }

    getState(page: string) {
        return this.states.find(x => x.page === page).state;
    }
}

const countries = {"🇦🇫": "Afghanistan", "🇦🇽": "Åland Islands", "🇦🇱": "Albania", "🇩🇿": "Algeria", "🇦🇸": "American Samoa", "🇦🇩": "Andorra", "🇦🇴": "Angola", "🇦🇮": "Anguilla", "🇦🇶": "Antarctica", "🇦🇬": "Antigua and Barbuda", "🇦🇷": "Argentina", "🇦🇲": "Armenia", "🇦🇼": "Aruba", "🇦🇨": "🇦🇨", "🇦🇺": "Australia", "🇦🇹": "Austria", "🇦🇿": "Azerbaijan", "🇧🇸": "Bahamas", "🇧🇭": "Bahrain", "🇧🇩": "Bangladesh", "🇧🇧": "Barbados", "🇧🇾": "Belarus", "🇧🇪": "Belgium", "🇧🇿": "Belize", "🇧🇯": "Benin", "🇧🇲": "Bermuda", "🇧🇹": "Bhutan", "🇧🇴": "Bolivia", "🇧🇦": "Bosnia and Herzegovina", "🇧🇼": "Botswana", "🇧🇻": "🇧🇻", "🇧🇷": "Brazil", "🇮🇴": "British Indian Ocean Territory", "🇻🇬": "British Virgin Islands", "🇧🇳": "Brunei", "🇧🇬": "Bulgaria", "🇧🇫": "Burkina Faso", "🇧🇮": "Burundi", "🇰🇭": "Cambodia", "🇨🇲": "Cameroon", "🇨🇦": "Canada", "🇮🇨": "🇮🇨", "🇨🇻": "Cape Verde", "🇧🇶": "🇧🇶", "🇰🇾": "Cayman Islands", "🇨🇫": "Central African Republic", "🇪🇦": "🇪🇦", "🇹🇩": "Chad", "🇨🇱": "Chile", "🇨🇳": "China", "🇨🇽": "Christmas Island", "🇨🇵": "🇨🇵", "🇨🇨": "Cocos Islands", "🇨🇴": "Colombia", "🇰🇲": "Comoros", "🇨🇬": "🇨🇬", "🇨🇩": "🇨🇩", "🇨🇰": "Cook Islands", "🇨🇷": "Costa Rica", "🇨🇮": "🇨🇮", "🇭🇷": "Croatia", "🇨🇺": "Cuba", "🇨🇼": "Curacao", "🇨🇾": "Cyprus", "🇨🇿": "Czech Republic", "🇩🇰": "Denmark", "🇩🇬": "🇩🇬", "🇩🇯": "Djibouti", "🇩🇲": "Dominica", "🇩🇴": "Dominican Republic", "🇪🇨": "Ecuador", "🇪🇬": "Egypt", "🇸🇻": "El Salvador", "🇬🇶": "Equatorial Guinea", "🇪🇷": "Eritrea", "🇪🇪": "Estonia", "🇪🇹": "Ethiopia", "🇪🇺": "🇪🇺", "🇫🇰": "Falkland Islands", "🇫🇴": "Faroe Islands", "🇫🇯": "Fiji", "🇫🇮": "Finland", "🇫🇷": "France", "🇬🇫": "🇬🇫", "🇵🇫": "French Polynesia", "🇹🇫": "🇹🇫", "🇬🇦": "Gabon", "🇬🇲": "Gambia", "🇬🇪": "Georgia", "🇩🇪": "Germany", "🇬🇭": "Ghana", "🇬🇮": "Gibraltar", "🇬🇷": "Greece", "🇬🇱": "Greenland", "🇬🇩": "Grenada", "🇬🇵": "🇬🇵", "🇬🇺": "Guam", "🇬🇹": "Guatemala", "🇬🇬": "Guernsey", "🇬🇳": "Guinea", "🇬🇼": "Guinea-Bissau", "🇬🇾": "Guyana", "🇭🇹": "Haiti", "🇭🇲": "🇭🇲", "🇭🇳": "Honduras", "🇭🇰": "Hong Kong", "🇭🇺": "Hungary", "🇮🇸": "Iceland", "🇮🇳": "India", "🇮🇩": "Indonesia", "🇮🇷": "Iran", "🇮🇶": "Iraq", "🇮🇪": "Ireland", "🇮🇲": "Isle of Man", "🇮🇱": "Israel", "🇮🇹": "Italy", "🇯🇲": "Jamaica", "🇯🇵": "Japan", "🇯🇪": "Jersey", "🇯🇴": "Jordan", "🇰🇿": "Kazakhstan", "🇰🇪": "Kenya", "🇰🇮": "Kiribati", "🇽🇰": "Kosovo", "🇰🇼": "Kuwait", "🇰🇬": "Kyrgyzstan", "🇱🇦": "Laos", "🇱🇻": "Latvia", "🇱🇧": "Lebanon", "🇱🇸": "Lesotho", "🇱🇷": "Liberia", "🇱🇾": "Libya", "🇱🇮": "Liechtenstein", "🇱🇹": "Lithuania", "🇱🇺": "Luxembourg", "🇲🇴": "Macau", "🇲🇰": "Macedonia", "🇲🇬": "Madagascar", "🇲🇼": "Malawi", "🇲🇾": "Malaysia", "🇲🇻": "Maldives", "🇲🇱": "Mali", "🇲🇹": "Malta", "🇲🇭": "Marshall Islands", "🇲🇶": "🇲🇶", "🇲🇷": "Mauritania", "🇲🇺": "Mauritius", "🇾🇹": "Mayotte", "🇲🇽": "Mexico", "🇫🇲": "Micronesia", "🇲🇩": "Moldova", "🇲🇨": "Monaco", "🇲🇳": "Mongolia", "🇲🇪": "Montenegro", "🇲🇸": "Montserrat", "🇲🇦": "Morocco", "🇲🇿": "Mozambique", "🇲🇲": "Myanmar", "🇳🇦": "Namibia", "🇳🇷": "Nauru", "🇳🇵": "Nepal", "🇳🇱": "Netherlands", "🇳🇨": "New Caledonia", "🇳🇿": "New Zealand", "🇳🇮": "Nicaragua", "🇳🇪": "Niger", "🇳🇬": "Nigeria", "🇳🇺": "Niue", "🇳🇫": "🇳🇫", "🇲🇵": "🇲🇵", "🇰🇵": "North Korea", "🇳🇴": "Norway", "🇴🇲": "Oman", "🇵🇰": "Pakistan", "🇵🇼": "Palau", "🇵🇸": "Palestine", "🇵🇦": "Panama", "🇵🇬": "Papua New Guinea", "🇵🇾": "Paraguay", "🇵🇪": "Peru", "🇵🇭": "Philippines", "🇵🇳": "Pitcairn", "🇵🇱": "Poland", "🇵🇹": "Portugal", "🇵🇷": "Puerto Rico", "🇶🇦": "Qatar", "🇷🇪": "Reunion", "🇷🇴": "Romania", "🇷🇺": "Russia", "🇷🇼": "Rwanda", "🇼🇸": "Samoa", "🇸🇲": "San Marino", "🇸🇹": "Sao Tome and Principe", "🇸🇦": "Saudi Arabia", "🇸🇳": "Senegal", "🇷🇸": "Serbia", "🇸🇨": "Seychelles", "🇸🇱": "Sierra Leone", "🇸🇬": "Singapore", "🇸🇽": "Sint Maarten", "🇸🇰": "Slovakia", "🇸🇮": "Slovenia", "🇸🇧": "Solomon Islands", "🇸🇴": "Somalia", "🇿🇦": "South Africa", "🇬🇸": "🇬🇸", "🇰🇷": "South Korea", "🇸🇸": "South Sudan", "🇪🇸": "Spain", "🇱🇰": "Sri Lanka", "🇧🇱": "Saint Barthelemy", "🇸🇭": "Saint Helena", "🇰🇳": "Saint Kitts and Nevis", "🇱🇨": "Saint Lucia", "🇲🇫": "Saint Martin", "🇵🇲": "Saint Pierre and Miquelon", "🇻🇨": "Saint Vincent and the Grenadines", "🇸🇩": "Sudan", "🇸🇷": "Suriname", "🇸🇯": "Svalbard and Jan Mayen", "🇸🇿": "Swaziland", "🇸🇪": "Sweden", "🇨🇭": "Switzerland", "🇸🇾": "Syria", "🇹🇼": "Taiwan", "🇹🇯": "Tajikistan", "🇹🇿": "Tanzania", "🇹🇭": "Thailand", "🇹🇱": "🇹🇱", "🇹🇬": "Togo", "🇹🇰": "Tokelau", "🇹🇴": "Tonga", "🇹🇹": "Trinidad and Tobago", "🇹🇦": "🇹🇦", "🇹🇳": "Tunisia", "🇹🇷": "Turkey", "🇹🇲": "Turkmenistan", "🇹🇨": "Turks and Caicos Islands", "🇹🇻": "Tuvalu", "🇺🇬": "Uganda", "🇺🇦": "Ukraine", "🇦🇪": "United Arab Emirates", "🇬🇧": "United Kingdom", "🇺🇸": "United States", "🇺🇾": "Uruguay", "🇺🇲": "🇺🇲", "🇻🇮": "U.S. Virgin Islands", "🇺🇿": "Uzbekistan", "🇻🇺": "Vanuatu", "🇻🇦": "Vatican", "🇻🇪": "Venezuela", "🇻🇳": "Vietnam", "🇼🇫": "Wallis and Futuna", "🇪🇭": "Western Sahara", "🇾🇪": "Yemen", "🇿🇲": "Zambia", "🇿🇼": "Zimbabwe"};