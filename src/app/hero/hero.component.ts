import {Component, ViewChild, ElementRef, EventEmitter, Inject, HostListener} from '@angular/core';
import * as _ from 'lodash';
import * as d3 from 'd3';
import {
  MushonKeyChart, MushonKeyFlow, MushonKeyFlowGroup,
  MushonkeyComponent
} from 'mushonkey';
import { BUBBLES } from '../constants';
import { __T as __ } from '../app.component';

const CENTER_WIDTH = 200;
const CENTER_HEIGHT = 80;
const CHART_MARGIN = {top: 20, left: 20, right: 20, bottom: 20};
const CENTER_VERTICAL_OFFSET = 100;
const EDUCATION_TARGET = '0020670142';

function tweenie(t: number) {
  t = Math.abs(t - 0.5);
  t = 1 - t * 2;
  return d3.easeExpOut(t);
}


interface Mutator {
  mutate(hero: HeroComponent, t: number): void;
  duration(): number;
}

class BaseMutator implements Mutator {

  duration_ = 1;

  mutate(hero: HeroComponent, t: number) {}

  duration() {
    return this.duration_;
  }
}

class Filler extends BaseMutator {
  constructor(duration: number) {
    super();
    this.duration_ = duration;
  }
}

class TransitionStep implements Mutator {
  private start: number;
  private stop: number;
  private active = false;
  private _duration: number;

  constructor(private _mutators: Array<Mutator>) {
    this._duration = d3.max(_mutators, (m) => m.duration());
  }

  duration() {
    return this._duration;
  }

  setRange(start: number, stop: number) {
    this.start = start;
    this.stop = stop;
  }

  mutate(hero: HeroComponent, t: number): void {
    let m: Mutator;
    if (t >= this.start && t <= this.stop) {
      this.active = true;
      t = (t - this.start) / (this.stop - this.start);
      for (m of this._mutators) {
        m.mutate(hero, t);
      }
    } else if (this.active) {
      this.active = false;
      let p = 0;
      if (t > this.stop) {
        p = 1;
      }
      for (m of this._mutators) {
        m.mutate(hero, p);
      }
    }
  }
}

class TransitionSteps extends BaseMutator {
  constructor(private _steps: Array<TransitionStep>) {
    super();
    const totalLength = d3.sum(_steps, (s) => s.duration());
    let ofs = 0;
    for (const step of _steps) {
      step.setRange(ofs / totalLength, (ofs + step.duration()) / totalLength);
      ofs += step.duration();
    }
    this.duration_ = totalLength;
  }

  mutate(hero: HeroComponent, t: number): void {
    for (const s of this._steps) {
      s.mutate(hero, t);
    }
  }
}

class HiglightText extends BaseMutator {
  constructor(private text: string,
              private ease?: any) {
    super();
    this.ease = ease || tweenie;
  }

  mutate(hero: HeroComponent, t: number): void {
    // hero.text = this.text;
    // hero.textOpacity = this.ease(t);
    // if (hero.dialogLines[hero.dialogLines.length-1].content !== this.text) {
    //   hero.dialogLines.push({content: this.text, direction: 'question'});
    //   if (hero.dialogLines.length > 7) {
    //     hero.dialogLines.shift();
    //   }
    // }
  }
}

class ShowDialogBit extends BaseMutator {
  constructor(private bit: DialogBit, private accumulate?: boolean) {
    super();
    this.duration_ = bit.adders.length + 1;
  }

  mutate(hero: HeroComponent, t: number): void {
    if (t < 1) {

      const tt = Math.floor(t * this.duration_);
      const tofs = t * this.duration_ - tt;
      hero.dialogLines =
        this.bit.start
          .slice(tt)
          .concat(this.bit.adders.slice(tt - 7 < 0 ? 0 : tt - 7, tt));
      for (const dl of hero.dialogLines) {
        dl['last'] = false;
      }
      hero.dialogLines[hero.dialogLines.length - 1]['last'] = true;
      if (this.accumulate) {
        hero.dialogOfs = 0;
      } else {
        hero.dialogOfs = tofs * 59.0;
      }
    }
  }
}


class UpdateMushonkey extends BaseMutator {
  constructor(private index: number) {
    super();
  }

  mutate(hero: HeroComponent, t: number): void {
    const chart = hero.chart;
    hero.chart = hero.charts[this.index];
    if (hero.mushonkeyComponent && chart !== hero.chart) {
      hero.mushonkeyComponent.updateChart(hero.chart);
    }
  }
}

class ChartIntroduce extends BaseMutator {
  constructor(private increasing: boolean) {
    super();
  }

  mutate(hero: HeroComponent, t: number): void {
    hero.chartOpacity = d3.easeExpOut(this.increasing ? t : 1 - t);
  }
}

class ChartShow extends BaseMutator {
  private opacity_: number;
  constructor(opacity?: number) {
    super();
    this.opacity_ = opacity || 1;
  }

  mutate(hero: HeroComponent, t: number): void {
    hero.chartOpacity = this.opacity_;
  }
}

class ConnectorShow extends BaseMutator {
  constructor() {
    super();
  }

  mutate(hero: HeroComponent, t: number): void {
    const connectors: Array<SVGElement> = hero.mushonkeyComponentWrapper.nativeElement.querySelectorAll('path');
    for (const connector of connectors) {
      connector.style.strokeDasharray = 'none';
      connector.style.strokeDashoffset = '0';
    }
    const labels: Array<SVGElement> = hero.mushonkeyComponentWrapper.nativeElement.querySelectorAll('text');
    for (const label of labels) {
      label.style.opacity = '1';
    }
  }
}

class ConnectorIntroduce extends BaseMutator {
  constructor(private klass: string, private direction?: string) {
    super();
    if (!this.direction) {
      this.direction = 'rtl';
    }
  }

  mutate(hero: HeroComponent, t: number): void {
    t = d3.easePolyInOut(t);
    const connectors: Array<SVGElement> = hero.mushonkeyComponentWrapper.nativeElement.querySelectorAll('path');
    for (const connector of connectors) {
      if (connector.classList.contains(this.klass)) {
        const cr = connector.getBoundingClientRect();
        const length = cr.width + cr.height;
        if (this.direction === 'rtl') {
          connector.style.strokeDasharray = length + ',100000';
          connector.style.strokeDashoffset = '' + ((1 - t) * length);
        } else {
          connector.style.strokeDasharray = length + ',100000';
          connector.style.strokeDashoffset = '-' + ((1 - t) * length);
        }
      }
    }
    const labels: Array<SVGElement> = hero.mushonkeyComponentWrapper.nativeElement.querySelectorAll('text');
    for (const label of labels) {
      if (label.classList.contains(this.klass)) {
        label.style.opacity = '' + t;
      }
    }
  }
}

class ConnectorToSublevel extends BaseMutator {
  constructor(private klass: string, private index: number, private going: boolean) {
    super();
  }

  mutate(hero: HeroComponent, t: number): void {
    let connectors: Array<SVGElement> = hero.mushonkeyComponentWrapper.nativeElement.querySelectorAll('path');
    connectors = Array.from(connectors);
    connectors = connectors.filter((c) => c.classList.contains(this.klass));
    const connector = connectors[this.index];
    if (connector) {
      if (!this.going) {
        t = 1 - t;
      }
      // let gap = tweenie(t) * 200;
      let gap = tweenie(t) * 2000;
      if (gap > 20) {
        gap = 20;
      }
      connector.style.strokeDasharray = '10,' + gap;
      connector.style.strokeDashoffset = '-' + (50 * t);
    }
  }
}

class DialogElement {
  constructor (private _direction: string, private _content: string) {}

  get content() {
    return this._content;
  }

  get direction() {
    return this._direction;
  }
}

function Q(content: string) {
    return new DialogElement('question', content);
}

function A(content: string) {
    return new DialogElement('answer', content);
}

const dialog = [
  Q(__('נו, אז תגידו - איך עובד תקציב המדינה?')),
  A(__('זה בעצם די פשוט&#8230;')),
  A(__('מצד אחד נכנס כסף - הכנסות')),
  A(__('ומהצד השני יוצא כסף - הוצאות')),

  Q(__('שניה רגע - מה הכוונה הכנסות? מאיפה מגיע הכסף?')),
  A(__('בעיקר ממס הכנסה (של אנשים ושל חברות)')),
  A(__('מס עקיף כמו מע״מ')),
  A(__('עוד לא מעט מקורות...')),
  A(__('אה, וגם אגרות!')),

  Q(__('ואז את כל הכסף שנכנס אפשר לבזבז!')),
  A(__('הממ... לא בדיוק')),
  A(__('בעצם מוציאים קצת יותר כסף ממה שנכנס')),

  Q(__('אז איך אנחנו לא נכנסים למינוס?')),
  A(__('כי האוכלוסיה גדלה והמשק צומח')),
  A(__('אז ההכנסות של השנה אחרי מכסות את הפער')),
  A(__('דרך אגב,')),
  A(__('ההפרש בין ההוצאות להכנסות נקרא ה״גירעון״.')),

  Q(__('אוקיי&hellip;')),
  Q(__('אבל מה עושים עם כל הכסף הזה?')),
  Q(__('בטוח שהרוב הולך לביטחון, נכון?')),
  A(__('דווקא לא &#x1f46e;&#x1f3fc;')),
  A(__('ההוצאה הכי גדולה בתקציב היא החזר חובות')),

  Q(__('ואללה? &#x1F62E;')),
  Q(__('זאת אומרת עדיין מחזירים הלוואות שלקחנו פעם?')),
  Q(__('רגע, למה ״החזר חובות״ צבוע בצבע אחר?')),
  A(__('אנחנו מפרידים בין החזר החובות לכל שאר ההוצאות')),
  A(__('כי על התקציב של ״שאר ההוצאות״')),
  A(__('יש הגבלות שמונעות ממנו לגדול')),
  A(__('גם אם יש כסף בקופה&hellip;')),

  Q(__('&#x1F914;')),
  Q(__('טוב, חוץ מהחזר חובות, מה עוד יש בתקציב?')),
  Q(__('איפה החרדים?')),
  Q(__('ההתנחלויות?')),
  Q(__('הערבים?')),
  Q(__('הפריפריה???')),
  A(__('רגע, רגע!')),
  A(__('בגדול, התקציב מחולק למשרדי הממשלה השונים.')),
  A(__('לכל משרד יש תקציב משלו,')),
  A(__('שמתחלק בין היחידות השונות בתוך המשרד')),
  A(__('וכן הלאה&hellip;')),
  A(__('כך שאם רוצים לדעת כמה כסף ״הולך לפריפריה״')),
  A(__('או ״להתנחלויות״ או ״לערבים״ או ״לחרדים״')),
  A(__('אז אין תשובה מוחלטת - כי אין משרדים כאלה')),
  Q(__('נראה לי שהגיע הזמן לדוגמה') +
    ' &#x1F605;'),
  A(__('קדימה!')),
  A(__('בוא נצלול לתוך תקציב משרד החינוך')),
  Q(__('מה? איפה זה?')),
  A(__('זה הקו המקווקו משמאל')),
  A(__('רגע&hellip;')),
  A(__('&hellip;')),
  A(__('&hellip;')),
  A(__('הופ!')),
  A(__('תקציב משרד החינוך ב-2020')),
  A(__('מעל 67 מיליארד שקלים')),
  Q(__('הבנתי... אז זה התקציב של משרד החינוך?')),
  A(__('כן, למשרדים הגדולים יש סעיף תקציבי משלהם')),
  A(__('אבל לא לכל המשרדים הקטנים')),
  A(__('(שבדרך כלל מוצמדים למשרד ראש הממשלה)')),
  Q(__('איך מחלקים את הכסף בתוך המשרד?')),
  A(__('לפי הנושאים הגדולים בהם המשרד מטפל')),
  Q(__('נגיד, מה זה  פעולות משלימות לקידום ?')),
  A(__('שאלה טובה... בוא נבדוק!')),
  A(__('צוללים פנימה עוד')),
  A(__('3&hellip;')),
  A(__('2&hellip;')),
  A(__('1&hellip;')),
  A(__('והופלה!')),
  A(__('תקציב ״פעולות משלימות לקידום״')),
  A(__('בערך 7 מיליארד שקלים')),
  Q(__('חחח.. "הופלה" &#x1F61C;')),
  Q(__('וואו, יש כאן המון דברים!')),
  Q(__('מעניין, מה זה המספר שיש ליד השם של הסעיף?')),
  Q(__('ה-<code>20.67</code> הזה?')),
  A(__('הבחנה טובה!')),
  A(__('באמת לכל סעיף תקציבי יש מספר -')),
  A(__('ככל שהסעיף יותר מפורט, המספר יותר ארוך')),
  Q(__('סבבה')),
  Q(__('אז מה עוד יש כאן? מה זה ״פעילויות ופרוייקטים״?')),
  A(__('אין שום בעיה')),
  A(__('שאלת שאלה')),
  A(__('והנה התשובה :)')),
  Q(__('התקציב הזה באמת מאוד מפורט')),
  A(__('התקציב לפעילויות ופרוייקטים')),
  A(__('הוא בערך חמישה מיליארד שקלים.')),
  A(__('סעיפי התקציב שברמה הזאת נקראים ״תכניות״')),
  A(__('לפעמים עושים שינויים בתקציב במהלך השנה')),
  A(__('ואז מעבירים כסף מתכנית אחת לאחרת.')),
  Q(__('זה קורה הרבה?')),
  A(__('במהלך שנה יכולים להיות אלפי שינויים כאלה')),
  A(__('שלפעמים משנים חלקים משמעותיים בתקציב!')),
  Q(__('לא יאומן &#x1F612;')),
  A(__('שנבדוק מה קורה בתוך ״תמיכה בתנועות נוער״?')),
  Q(__('קדימה!')),
    // '&#x1F466;&#x1F3FD;' +
    // '&#x1F467;&#x1F3FE;'),
  A(__('תקציב התמיכה בתנועות נוער')),
  A(__('הוא כמעט מאה וחמישים מיליון שקל.')),
  A(__('הגענו!') +
    ' &#x1F389;'),
  Q(__('לאן?')),
  A(__('זאת הרמה הכי מפורטת של התקציב')),
  A(__('שנקראת גם תקנה תקציבית')),
  Q(__('אז מה קורה עם הכסף מכאן?')),
  A(__('מכאן והלאה הכסף יוצא החוצה') +
    ' &#x1F4B8;'),
  A(__('כמשכורת') +
    ' &#x1F4B5;, ' +
    __('קניות') +
    ' &#x1F6CD;, ' +
    __('או - במקרה שלנו')),
  A(__('לתמיכה בארגונים שונים ')),
    // '&#x1F54D;&#x1F3DF;&#x1F3DB;&#x1F3D7;'),
  A(__('כמו הנוער העובד והלומד')),
  A(__('תנועת הצופים')),
  A(__('או בני-עקיבא')),
  Q(__('נראה לי שהבנתי את הרוב &#x1F60E;')),
  Q(__('מה כדאי לי לעשות עכשיו?')),
  A(__('להתחיל לחפור באתר כמובן &#x1F913;')),
  A(__('הנה כמה כיוונים מעניינים:')),
  A('<a target="_blank" href="/s/?q=פעילות לעידוד עסקים קטנים ובינוניים&dd=supports">' +
    __('אילו סטארט-אפים מקבלים תמיכה מהמדען הראשי') +
    '</a>?'),
  A(__('כמה תקציבים מקבלת') +
    '<a target="_blank" href="/i/org/municipality/500210315"> ' +
    __('העיר שדרות') +
    '</a>? ' +
    __('ומה לגבי') +
    ' <a target="_blank" href="/i/org/municipality/500236112">' +
    __('קרית ארבע') +
    '</a>?'),
  A('<a target="_blank" href="/s/?q=%D7%96%D7%94%D7%95%D7%AA%20%D7%99%D7%94%D7%95%D7%93%D7%99%D7%AA&dd=entities">' +
    __('מהן העמותות המקדמות ׳זהות יהודית׳') +
    '</a>?'),
  A('<a target="_blank" href="/i/org/association/580190080">' +
    __('כמה מכספי משלם המסים מקבל תיאטרון ״גשר״') +
    '</a>?'),
  A('<a target="_blank" href="/s/?q=%D7%9E%D7%95%D7%A1%D7%93%D7%95%D7%AA%20%D7%AA%D7%95%D7%A8%D7%A0%D7%99%D7%99%D7%9D&dd=budget">' +
    __('מה תקציב התמיכה בכוללים והישיבות') +
    '</a>?'),
  A(__('בהצלחה!!!')),
  Q(__('תודה! אלה היו חמש דקות ששינו את חיי &#x1F64F;')),
];

interface DialogBit {
  start: any[];
  adders: any[];
}

const dialogBits: Array<DialogBit> = [];
for (let i = 0; i < dialog.length; i++) {
  if (dialog[i].direction === 'question') {
    if (i > 0 && dialog[i - 1].direction  === 'question') {
      continue;
    }
    const bit = {
      start: <any[]>[],
      adders: <any[]>[],
    };
    let j = i;
    while (j >= 0 && bit.start.length < 7) {
      bit.start.unshift(dialog[j]);
      j--;
    }
    while (bit.start.length < 7) {
      bit.start.unshift({});
    }
    let answered = false;
    j = i + 1;
    while (j < dialog.length) {
      if (dialog[j].direction === 'answer') {
        answered = true;
      } else {
        if (answered) {
          break;
        }
      }
      bit.adders.push(dialog[j]);
      j++;
    }
    dialogBits.push(bit);
  }
}


@Component({
  selector: 'the-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.less']
})
export class HeroComponent {

  @ViewChild('mushonkeyWrapper') mushonkeyComponentWrapper: ElementRef;
  @ViewChild('mushonkey') mushonkeyComponent: MushonkeyComponent;
  @ViewChild('hero') heroElement: ElementRef;

  private ts: TransitionSteps;

  text = __('זה בעצם די פשוט&#8230;');
  textOpacity = 1;
  chart: MushonKeyChart;
  chartOpacity = 0;
  charts: Array<MushonKeyChart> = [];
  dialogLines: DialogElement[] = [];
  dialogOfs = 0;
  scroller = new EventEmitter<Number>();

  static makeFlow(amount: number, title: string, scale?: any) {
    scale = scale || [1000000000, __(`מיל'`)];
    const billions = amount / scale[0];
    const digits = billions < 5 ? 1 : 0;
    const amountStr =  billions.toFixed(digits) + ' ' + scale[1];
    title = title + ' ' + amountStr;
    return new MushonKeyFlow(amount, title, null);
  }

  constructor(@Inject(BUBBLES) private bubbles: any) {
    this.makeDeficitCharts(bubbles.deficitChart);
    _.map(bubbles.educationCharts, (c) => this.makeEducationCharts(c));
    this.makeSupportChart(bubbles.supportChart[0], bubbles.supportChart[1]);
    let chartIdx = 0;
    let dialogBit = 0;
    this.ts = new TransitionSteps([
      new TransitionStep([
        // new HiglightText('זה בעצם די פשוט&#8230;', (t: number) => d3.easePolyInOut(1-t)),
        new ShowDialogBit(dialogBits[dialogBit]),
        new TransitionSteps([
          new TransitionStep([
            new ChartIntroduce(true),
            new UpdateMushonkey(chartIdx),
          ]),
          new TransitionStep([
            new UpdateMushonkey(++chartIdx),
            new ConnectorShow(),
            new ConnectorIntroduce('income', 'ltr'),
            new ChartShow(),
          ]),
          new TransitionStep([
            new UpdateMushonkey(++chartIdx),
            new ChartShow(),
            new ConnectorShow(),
            new ConnectorIntroduce('expenses'),
          ]),
        ])
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
        new TransitionSteps([
          new TransitionStep([
            new ChartShow(),
            new ConnectorShow(),
          ]),
          new TransitionStep([new UpdateMushonkey(++chartIdx), ]),
          new TransitionStep([new UpdateMushonkey(++chartIdx), ]),
          new TransitionStep([new UpdateMushonkey(++chartIdx), ]),
          new TransitionStep([new UpdateMushonkey(++chartIdx), ]),
        ])
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
        new TransitionSteps([
          new TransitionStep([ new UpdateMushonkey(chartIdx), new Filler(4), ]),
          new TransitionStep([
            new UpdateMushonkey(++chartIdx),
            new ChartShow(),
            new ConnectorShow(),
            new ConnectorIntroduce('deficit'),
          ])
        ])
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
        new TransitionSteps([
          new TransitionStep([ new UpdateMushonkey(chartIdx), new Filler(4), ]),
          new TransitionStep([
            new UpdateMushonkey(++chartIdx),
            new ChartShow(),
            new ConnectorShow(),
            new ConnectorIntroduce('debt'),
          ])
        ])
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
        new TransitionSteps([
          new TransitionStep([ new UpdateMushonkey(chartIdx), new Filler(7), ]),
          new TransitionStep([
            new ChartShow(),
            new ConnectorShow(),
          ]),
          new TransitionStep([
            new UpdateMushonkey(++chartIdx),
          ]),
          new TransitionStep([ new UpdateMushonkey(chartIdx),  new Filler(5), ]),
        ])
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
        new UpdateMushonkey(chartIdx),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
        new TransitionSteps([
          new TransitionStep([
            new UpdateMushonkey(chartIdx),
            new ConnectorShow(),
            new ConnectorToSublevel('expenses', 0, true),
            new TransitionStep([ new Filler(4), ]),
            new ChartIntroduce(false),
          ]),
          new TransitionStep([
            new ChartIntroduce(true),
            new UpdateMushonkey(++chartIdx),
            new ConnectorShow(),
            new ConnectorToSublevel('income', 0, false),
          ])
        ])
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
        new UpdateMushonkey(chartIdx),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
        new UpdateMushonkey(chartIdx),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
        new TransitionSteps([
          new TransitionStep([ new Filler(2), ]),
          new TransitionStep([
            new UpdateMushonkey(chartIdx),
            new ConnectorShow(),
            new ConnectorToSublevel('expenses', 3, true),
            new TransitionStep([ new Filler(4), ]),
            new ChartIntroduce(false),
          ]),
          new TransitionStep([
            new ChartIntroduce(true),
            new UpdateMushonkey(++chartIdx),
            new ConnectorToSublevel('income', 0, false),
          ]),
        ])
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
        new UpdateMushonkey(chartIdx),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
        new TransitionSteps([
          new TransitionStep([
            new UpdateMushonkey(chartIdx),
            new ConnectorToSublevel('expenses', 0, true),
            new ChartIntroduce(false),
          ]),
          new TransitionStep([
            new ChartIntroduce(true),
            new UpdateMushonkey(++chartIdx),
            new ConnectorToSublevel('income', 0, false),
          ]),
        ])
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
        new UpdateMushonkey(chartIdx),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
        new UpdateMushonkey(chartIdx),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit]),
        new TransitionSteps([
          new TransitionStep([ new UpdateMushonkey(chartIdx), new Filler(3) ]),
          new TransitionStep([
            new UpdateMushonkey(chartIdx),
            new ConnectorToSublevel('expenses', 3, true),
            new ChartIntroduce(false),
          ]),
          new TransitionStep([
            new ChartIntroduce(true),
            new UpdateMushonkey(++chartIdx),
            new ConnectorToSublevel('income', 0, false),
          ]),
        ])
      ]),
      new TransitionStep([
        new UpdateMushonkey(chartIdx),
        new ShowDialogBit(dialogBits[++dialogBit]),
      ]),
      new TransitionStep([
        new UpdateMushonkey(chartIdx),
        new ShowDialogBit(dialogBits[++dialogBit]),
      ]),
      new TransitionStep([
        new UpdateMushonkey(chartIdx),
        new ShowDialogBit(dialogBits[++dialogBit]),
      ]),
      new TransitionStep([
        new UpdateMushonkey(chartIdx),
        new ChartIntroduce(false),
      ]),
      new TransitionStep([
        new ChartShow(0.01),
        new ShowDialogBit(dialogBits[++dialogBit], true),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[++dialogBit], true),
      ]),
    ]);

    this.scroller.subscribe((progress: number) => {
      progress = 1.18 * progress - 0.06;
      progress = progress < 0 ? 0 : progress;
      progress = progress > 1 ? 1 : progress;
      this.ts.mutate(this, progress);
    });
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event) {
    setTimeout(() => {
      const el = this.heroElement.nativeElement;
      const rectTop = el.getBoundingClientRect().top;
      const offsetHeight = el.scrollHeight;
      if ((rectTop < 0) && (rectTop > -offsetHeight)) {
        const progress = -1 * rectTop / offsetHeight;
        this.scroller.emit(progress);
      } else if (rectTop > 0) {
        this.scroller.emit(0);
      } else {
        this.scroller.emit(1);
      }
    }, 10);
  }

  makeDeficitCharts(data: any) {
    const expenseChildren: Array<any> = _.sortBy(data.expenseChildren, (d: any) => -d.net_revised || -d.net_allocated);
    const semiExpenseRest = data.budget;
    const expenseRest = semiExpenseRest - _.sum(
        _.map(_.slice(expenseChildren, 1, 4),
          (d: any) => d.net_revised || d.net_allocated)
    );

    const incomesFlowGroup = new MushonKeyFlowGroup(
      false, [
        HeroComponent.makeFlow(data.income, __('הכנסות המדינה'))
      ], 'income', 20
    );
    const deficitFlowGroup = new MushonKeyFlowGroup(
      false, [
        HeroComponent.makeFlow(data.budget - data.income, __('הגירעון'))
      ], 'deficit', -100, 0.7
    );

    const incomeChildren: Array<any> = _.sortBy(data.incomeChildren, (d: any) => -d.net_amount);
    const kidsNum = [1, 2, 3, 4];

    const expandedIncomesFlowGroup = _.map(kidsNum, (k) => {
      const incomeRest = data.income - _.sum(
        _.map(_.slice(incomeChildren, 0, k),
          (d: any) => d.net_revised || d.net_allocated)
      );
      const flows = [];
      for (let i = 0 ; i < k ; i++ ) {
        flows.push(HeroComponent.makeFlow(incomeChildren[i].net_amount, __(incomeChildren[i].title)));
      }
      if (k !== 4) {
        flows.push(HeroComponent.makeFlow(incomeRest, '...'));
      }
      return new MushonKeyFlowGroup(
        false, flows, 'income', 20
      );
    });
    const expensesFlowGroup = new MushonKeyFlowGroup(
      true, [
        HeroComponent.makeFlow(data.budget + data.returns, __('הוצאות הממשלה'))
      ], 'expenses', 20
    );
    const debtFlowGroup = new MushonKeyFlowGroup(
      true, [
        HeroComponent.makeFlow(data.returns, __('החזר חובות')),
      ], 'debt', -100, 0.7
    );
    const semiExpandedExpensesFlowGroup = new MushonKeyFlowGroup(
      true, [
        HeroComponent.makeFlow(semiExpenseRest, __('הוצאות משרדי הממשלה'))
      ], 'expenses', 20
    );
    const expandedExpensesFlowGroup = new MushonKeyFlowGroup(
      true, [
        HeroComponent.makeFlow(expenseChildren[1].net_revised || expenseChildren[1].net_allocated, __(expenseChildren[1].title)),
        HeroComponent.makeFlow(expenseChildren[2].net_revised || expenseChildren[2].net_allocated, __(expenseChildren[2].title)),
        HeroComponent.makeFlow(expenseChildren[3].net_revised || expenseChildren[3].net_allocated, __(expenseChildren[3].title)),
        HeroComponent.makeFlow(expenseRest, __('משרדי ממשלה אחרים'))
      ], 'expenses', 20
    );

    this.charts.push(new MushonKeyChart([
      ],
      __('תקציב המדינה'),
      CENTER_WIDTH, CENTER_HEIGHT, true, CHART_MARGIN, CENTER_VERTICAL_OFFSET
    ));
    this.charts.push(new MushonKeyChart([
        incomesFlowGroup,
      ],
      __('תקציב המדינה'),
      CENTER_WIDTH, CENTER_HEIGHT, true, CHART_MARGIN, CENTER_VERTICAL_OFFSET
    ));
    this.charts.push(new MushonKeyChart([
        incomesFlowGroup,
        expensesFlowGroup,
      ],
      __('תקציב המדינה'),
      CENTER_WIDTH, CENTER_HEIGHT,  true, CHART_MARGIN, CENTER_VERTICAL_OFFSET
    ));
    this.charts.push(new MushonKeyChart([
        expensesFlowGroup,
        expandedIncomesFlowGroup[0],
      ],
      __('תקציב המדינה'),
      CENTER_WIDTH, CENTER_HEIGHT,  true, CHART_MARGIN, CENTER_VERTICAL_OFFSET
    ));
    this.charts.push(new MushonKeyChart([
        expensesFlowGroup,
        expandedIncomesFlowGroup[1],
      ],
      __('תקציב המדינה'),
      CENTER_WIDTH, CENTER_HEIGHT,  true, CHART_MARGIN, CENTER_VERTICAL_OFFSET
    ));
    this.charts.push(new MushonKeyChart([
        expensesFlowGroup,
        expandedIncomesFlowGroup[2],
      ],
      __('תקציב המדינה'),
      CENTER_WIDTH, CENTER_HEIGHT,  true, CHART_MARGIN, CENTER_VERTICAL_OFFSET
    ));
    this.charts.push(new MushonKeyChart([
        expensesFlowGroup,
        expandedIncomesFlowGroup[3],
      ],
      __('תקציב המדינה'),
      CENTER_WIDTH, CENTER_HEIGHT,  true, CHART_MARGIN, CENTER_VERTICAL_OFFSET
    ));
    this.charts.push(new MushonKeyChart([
        deficitFlowGroup,
        expensesFlowGroup,
        expandedIncomesFlowGroup[3],
      ],
      __('תקציב המדינה'),
      CENTER_WIDTH, CENTER_HEIGHT,  true, CHART_MARGIN, CENTER_VERTICAL_OFFSET
    ));
    this.charts.push(new MushonKeyChart([
        deficitFlowGroup,
        debtFlowGroup,
        semiExpandedExpensesFlowGroup,
        expandedIncomesFlowGroup[3],
      ],
      __('תקציב המדינה'),
      CENTER_WIDTH, CENTER_HEIGHT,  true, CHART_MARGIN, CENTER_VERTICAL_OFFSET
    ));
    this.charts.push(new MushonKeyChart([
        deficitFlowGroup,
        debtFlowGroup,
        expandedExpensesFlowGroup,
        expandedIncomesFlowGroup[3],
      ],
      __('תקציב המדינה'),
      CENTER_WIDTH, CENTER_HEIGHT,  true, CHART_MARGIN, CENTER_VERTICAL_OFFSET
    ));

  }

  makeEducationCharts(data: any) {
    const numToShow = 3;
    const children: Array<any> = _.sortBy(data.children, (d: any) => -d.net_revised || -d.net_allocated);
    let rest = (data.net_revised || data.net_allocated);
    const flows = [];
    for (const child of children) {
      if (flows.length < numToShow || EDUCATION_TARGET.indexOf(child.code) === 0) {
        flows.push(HeroComponent.makeFlow(child.net_revised || child.net_allocated, child.title));
      }
      rest -= (child.net_revised || child.net_allocated);
    }
    for (let i = 0 ; i < Math.min(numToShow, children.length) ; i++ ) {
    }
    flows.push(HeroComponent.makeFlow(rest, 'אחרים...'));
    const chart = new MushonKeyChart([
        new MushonKeyFlowGroup(
          true, flows, 'expenses', 20
        ),
        new MushonKeyFlowGroup(
          false, [
            HeroComponent
              .makeFlow(data.net_revised || data.net_allocated,
                '…' + 'מתוך תקציב ' + data.hierarchy[data.hierarchy.length - 1][1] + ': ')
          ], 'income', -100
        ),
      ],
      data.title + ' ' + data['nice-code'],
      CENTER_WIDTH, CENTER_HEIGHT,  true, CHART_MARGIN
    );
    this.charts.push(chart);
  }

  makeSupportChart(supportData: any, budgetData: any) {
    const numToShow = 5;
    const children: Array<any> = _.sortBy(supportData, (d: any) => -d.total_amount);
    const total = _.sum(_.map(children, (d) => d.total_amount));
    const rest = total - _.sum(
        _.map(_.slice(children, 0, numToShow),
          (d: any) => d.total_amount)
      );
    const scale = [1000000, 'מיליון ₪'];
    const flows = [];
    for (let i = 0 ; i < numToShow ; i++ ) {
      flows.push(HeroComponent.makeFlow(children[i].total_amount, children[i].entity_name, scale));
    }
    flows.push(HeroComponent.makeFlow(rest, 'אחרים...', scale));
    const group = new MushonKeyFlowGroup(
      true, flows, 'supports', 20
    );
    group.labelTextSize = 12;
    const chart = new MushonKeyChart([
        group,
        new MushonKeyFlowGroup(
          false, [
            HeroComponent
              .makeFlow(budgetData.net_revised || budgetData.net_allocated,
                '…' + 'מתוך תקציב ' + budgetData.hierarchy[budgetData.hierarchy.length - 1][1] + ': ',
              scale)
          ], 'income', -100
        ),
      ],
      budgetData.title + ' ' + budgetData['nice-code'],
      CENTER_WIDTH, CENTER_HEIGHT,  true, CHART_MARGIN
    );
    this.charts.push(chart);
  }

}
