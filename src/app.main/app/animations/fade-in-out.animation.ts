import { animate, trigger, style, keyframes, state, transition } from '@angular/animations';

export const fadeInOut = trigger('fadeInOut', [
    transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
    ]),
    transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
    ]),
]);
