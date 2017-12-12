import {Injectable, EventEmitter} from '@angular/core';
import * as _scrollama from 'scrollama';

let scrollama: any = _scrollama;

class Event {
  element: HTMLElement;
  index: number;
  progress: number;
  direction: string;
}

export interface ScrollyListener {
  onScrolly(id: string, progress: number) : void;
}

@Injectable()
export class ScrollyService {

  private scroller: any;
  private emitter: EventEmitter<any>;

  constructor() {
    this.scroller = scrollama();
    this.emitter = new EventEmitter();
  }

  public init() {
    // setup the instance, pass callback functions
    let x: any;
    this.scroller.setup({
      step: '.step', // required
      container: '.scroll', // required (for sticky)
      graphic: '.sticky', // required (for sticky)
      offset: 0.2,   // optional, default = 0.5
      debug: false,  // optional, default = false
      progress: true,  // optional, default = false
    })
      .onStepEnter((x: Event) => this.handleStepEnter(x))
      .onStepExit((x: Event) => this.handleStepExit(x))
      .onStepProgress((x: Event) => this.handleStepProgress(x))
  }

  handleStepEnter(x: Event) {
    let elId = x.element.getAttribute('data-id');
    console.log('enter', elId, x.direction);
    if (x.direction === 'down') {
      this.emit(elId, 0);
    } else {
      this.emit(elId, 1);
    }
  }

  handleStepExit(x: Event) {
    let elId = x.element.getAttribute('data-id');
    console.log('exit', elId, x.direction);
    if (x.direction === 'down') {
      this.emit(elId, 1);
    } else {
      this.emit(elId, 0);
    }
  }

  handleStepProgress(x: Event) {
    let elId = x.element.getAttribute('data-id');
    this.emit(elId, x.progress)
  }

  subscribe(listener: ScrollyListener) {
    this.emitter.subscribe((d: any) => listener.onScrolly(d.id, d.progress));
  }

  emit(id: string, progress: number) {
    // console.log(id, '<--', progress);
    setTimeout(() => {
      this.emitter.emit({ id: id, progress: progress });
    }, 0)
  }
}
