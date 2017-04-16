import { Directive, ElementRef, HostListener, HostBinding, Renderer, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appVideoControl]'
})
export class VideoControlDirective {

  @Output() progress: EventEmitter<number> = new EventEmitter();

  constructor(
    private host: ElementRef,
    private renderer: Renderer
  ) { }

  @HostBinding('class.paused') isPaused: boolean = true;

  @HostListener('click') onclick() {
    if (!this.isPaused) {
      this.renderer.invokeElementMethod(this.host.nativeElement, 'pause');
    } else {
      this.renderer.invokeElementMethod(this.host.nativeElement, 'play');
    }
    this.isPaused = !this.isPaused;
  }

  @HostListener('timeupdate', ['$event']) ontimeupdate(event: MediaStreamEvent) {
    const { duration, currentTime } = event.target as HTMLVideoElement;
    this.progress.emit(currentTime / duration * 100);
  }
}
