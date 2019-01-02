import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'speech-bubble',
  templateUrl: './speech-bubble.component.html',
  styleUrls: ['./speech-bubble.component.less']
})
export class SpeechBubbleComponent implements OnInit {

  @Input() kind: string;
  @Input() content: string;
  @Input() enter: boolean;

  constructor() { }

  ngOnInit() {
  }

}
