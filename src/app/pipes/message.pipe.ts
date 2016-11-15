import { Pipe } from "@angular/core";

@Pipe({
    name: "reverse"
})
export class ReversePipe {
    transform(array: any[]) {
        return array.reverse();
    }
}