import {Component, Input, Inject, HostListener, ViewChild, ElementRef, EventEmitter, Renderer} from '@angular/core';
import * as _ from 'lodash';
import * as d3 from 'd3';
import {
  MushonKeyChart, MushonKeyFlow, MushonKeyFlowGroup,
  MushonkeyComponent
} from "mushonkey/lib/components/MushonkeyComponent";
import {BudgetKeyMainPageService} from "../services/budgetkey-main-page";

function tweenie(t: number) {
  t = Math.abs(t - 0.5);
  t = 1 - t*2;
  return d3.easeExpOut(t)
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
    this._duration = d3.max(_mutators, (m) => m.duration())
  }

  duration() {
    return this._duration;
  };

  setRange(start: number, stop: number) {
    this.start = start;
    this.stop = stop;
  }

  mutate(hero: HeroComponent, t: number): void {
    let m: Mutator;
    if (t>=this.start && t<=this.stop) {
      this.active = true;
      t = (t-this.start) / (this.stop - this.start);
      for (m of this._mutators) {
        m.mutate(hero, t);
      }
    } else if (this.active) {
      this.active = false;
      let p = 0;
      if (t>this.stop) {
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
    let totalLength = d3.sum(_steps, (s) => s.duration());
    let ofs = 0;
    for (let step of _steps) {
      step.setRange(ofs/totalLength, (ofs + step.duration())/totalLength);
      ofs += step.duration();
    }
    this.duration_ = totalLength;
  }

  mutate(hero: HeroComponent, t: number): void {
    for (let s of this._steps) {
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

      let tt = Math.floor(t * this.duration_);
      let tofs = t * this.duration_ - tt;
      hero.dialogLines =
        this.bit.start
          .slice(tt)
          .concat(this.bit.adders.slice(tt - 7 < 0 ? 0 : tt - 7, tt));
      for (let dl of hero.dialogLines) {
        dl['last'] = false;
      }
      hero.dialogLines[hero.dialogLines.length-1]['last'] = true;
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
    let chart = hero.chart;
    hero.chart = hero.charts[this.index];
    if (hero.mushonkeyComponent && chart != hero.chart) {
      hero.mushonkeyComponent.updateChart(hero.chart);
    }
  }
}

class ChartIntroduce extends BaseMutator {
  constructor(private increasing: boolean) {
    super();
  }

  mutate(hero: HeroComponent, t: number): void {
    hero.chartOpacity = d3.easeExpOut(this.increasing? t : 1-t);
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
    let connectors: Array<SVGElement> = hero.mushonkeyComponentWrapper.nativeElement.querySelectorAll('path');
    for (let connector of connectors) {
      connector.style.strokeDasharray = 'none';
      connector.style.strokeDashoffset = '0';
    }
    let labels: Array<SVGElement> = hero.mushonkeyComponentWrapper.nativeElement.querySelectorAll('text');
    for (let label of labels) {
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
    let connectors: Array<SVGElement> = hero.mushonkeyComponentWrapper.nativeElement.querySelectorAll('path');
    for (let connector of connectors) {
      if (connector.classList.contains(this.klass)) {
        let cr = connector.getBoundingClientRect();
        let length = cr.width + cr.height;
        if (this.direction == 'rtl') {
          connector.style.strokeDasharray = length+',100000';
          connector.style.strokeDashoffset = ''+((1-t)*length);
        } else {
          connector.style.strokeDasharray = length+',100000';
          connector.style.strokeDashoffset = '-'+((1-t)*length);
        }
      }
    }
    let labels: Array<SVGElement> = hero.mushonkeyComponentWrapper.nativeElement.querySelectorAll('text');
    for (let label of labels) {
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
    let connector = connectors[this.index];
    if (connector) {
      if (!this.going) {
        t = 1-t;
      }
      // let gap = tweenie(t) * 200;
      let gap = tweenie(t) * 2000;
      if (gap > 20) {
        gap = 20;
      }
      connector.style.strokeDasharray = '10,'+gap;
      connector.style.strokeDashoffset = '-'+(50*t);
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

let dialog = [
  Q('נו, אז תגידו - איך עובד תקציב המדינה?'),
  A('זה בעצם די פשוט&#8230;'),
  A('מצד אחד נכנס כסף - הכנסות'),
  A('ומהצד השני יוצא כסף - הוצאות'),

  Q('שניה רגע - מה הכוונה הכנסות? מאיפה מגיע הכסף?'),
  A('בעיקר ממס הכנסה (של אנשים ושל חברות)'),
  A('מס עקיף כמו מע״מ'),
  A('עוד לא מעט מקורות...'),
  A('אה, וגם אגרות!'),

  Q('ואז את כל הכסף שנכנס אפשר לבזבז!'),
  A('הממ... לא בדיוק'),
  A('בעצם מוציאים קצת יותר כסף ממה שנכנס'),

  Q('אז איך אנחנו לא נכנסים למינוס?'),
  A('כי האוכלוסיה גדלה והמשק צומח'),
  A('אז ההכנסות של השנה אחרי מכסות את הפער'),
  A('דרך אגב,'),
  A('ההפרש בין ההוצאות להכנסות נקרא ה״גירעון״.'),

  Q('אוקיי&hellip;'),
  Q('אבל מה עושים עם כל הכסף הזה?'),
  Q('בטוח שהרוב הולך לביטחון, נכון?'),
  A('דווקא לא &#x1f46e;&#x1f3fc;'),
  A('ההוצאה הכי גדולה בתקציב היא החזר חובות'),

  Q('ואללה? &#x1F62E;'),
  Q('זאת אומרת עדיין מחזירים הלוואות שלקחנו פעם?'),
  Q('רגע, למה ״החזר חובות״ צבוע בצבע אחר?'),
  A('אנחנו מפרידים בין החזר החובות לכל שאר ההוצאות'),
  A('כי על התקציב של ״שאר ההוצאות״'),
  A('יש הגבלות שמונעות ממנו לגדול'),
  A('גם אם יש כסף בקופה&hellip;'),

  Q('&#x1F914;'),
  Q('טוב, חוץ מהחזר חובות, מה עוד יש בתקציב?'),
  Q('איפה החרדים?'),
  Q('ההתנחלויות?'),
  Q('הערבים?'),
  Q('הפריפריה???'),
  A('רגע, רגע!'),
  A('בגדול, התקציב מחולק למשרדי הממשלה השונים.'),
  A('לכל משרד יש תקציב משלו,'),
  A('שמתחלק בין היחידות השונות בתוך המשרד'),
  A('וכן הלאה&hellip;'),
  A('כך שאם רוצים לדעת כמה כסף ״הולך לפריפריה״'),
  A('או ״להתנחלויות״ או ״לערבים״ או ״לחרדים״'),
  A('אז אין תשובה מוחלטת - כי אין משרדים כאלה'),
  Q('נראה לי שהגיע הזמן לדוגמה' +
    ' &#x1F605;'),
  A('קדימה!'),
  A('בוא נצלול לתוך תקציב משרד החינוך'),
  Q('מה? איפה זה?'),
  A('זה הקו המקווקו משמאל'),
  A('רגע&hellip;'),
  A('&hellip;'),
  A('&hellip;'),
  A('הופ!'),
  A('תקציב משרד החינוך ב-2018'),
  A('מעל 56 מיליארד שקלים'),
  Q('הבנתי... אז זה התקציב של משרד החינוך?'),
  A('כן, למשרדים הגדולים יש סעיף תקציבי משלהם'),
  A('אבל לא לכל המשרדים הקטנים'),
  A('(שבדרך כלל מוצמדים למשרד ראש הממשלה)'),
  Q('איך מחלקים את הכסף בתוך המשרד?'),
  A('לפי הנושאים הגדולים בהם המשרד מטפל'),
  Q('נגיד, מה זה ״תכניות לימודים משלימות״?'),
  A('שאלה טובה... בוא נבדוק!'),
  A('צוללים פנימה עוד'),
  A('3&hellip;'),
  A('2&hellip;'),
  A('1&hellip;'),
  A('והופלה!'),
  A('תקציב תכניות לימודים משלימות'),
  A('בערך 4 מיליארד שקלים'),
  Q('חחח.. "הופלה" &#x1F61C;'),
  Q('וואו, יש כאן המון דברים!'),
  Q('מעניין, מה זה המספר שיש ליד השם של הסעיף?'),
  Q('ה-<code>24.06</code> הזה?'),
  A('הבחנה טובה!'),
  A('באמת לכל סעיף תקציבי יש מספר -'),
  A('ככל שהסעיף יותר מפורט, המספר יותר ארוך'),
  Q('סבבה'),
  Q('אז מה עוד יש כאן? מה זה חינוך בלתי פורמאלי?'),
  A('אין שום בעיה'),
  A('שאלת שאלה'),
  A('והנה התשובה :)'),
  Q('התקציב הזה באמת מאוד מפורט'),
  A('התקציב לחינוך בלתי פורמאלי'),
  A('הוא כמעט מיליארד שקלים.'),
  A('סעיפי התקציב שברמה הזאת נקראים ״תכניות״'),
  A('לפעמים עושים שינויים בתקציב במהלך השנה'),
  A('ואז מעבירים כסף מתכנית אחת לאחרת.'),
  Q('זה קורה הרבה?'),
  A('במהלך שנה יכולים להיות אלפי שינויים כאלה'),
  A('שלפעמים משנים חלקים משמעותיים בתקציב!'),
  Q('לא יאומן &#x1F612;'),
  A('שנבדוק מה קורה בתוך ״תמיכה בתנועות נוער״?'),
  Q('קדימה!'),
    // '&#x1F466;&#x1F3FD;' +
    // '&#x1F467;&#x1F3FE;'),
  A('תקציב התמיכה בתנועות נוער'),
  A('הוא כמעט מאה מיליון שקל.'),
  A('הגענו!  ' +
    '&#x1F389;'),
  Q('לאן?'),
  A('זאת הרמה הכי מפורטת של התקציב'),
  A('שנקראת גם תקנה תקציבית'),
  Q('אז מה קורה עם הכסף מכאן?'),
  A('מכאן והלאה הכסף יוצא החוצה ' +
    '&#x1F4B8;'),
  A('כמשכורת' +
    ' &#x1F4B5;, ' +
    'קניות' +
    ' &#x1F6CD;,' +
    ' או - במקרה שלנו'),
  A('לתמיכה בארגונים שונים '),
    // '&#x1F54D;&#x1F3DF;&#x1F3DB;&#x1F3D7;'),
  A('כמו הנוער העובד והלומד'),
  A('תנועת הצופים'),
  A('או בני-עקיבא'),
  Q('נראה לי שהבנתי את הרוב &#x1F60E;'),
  Q('מה כדאי לי לעשות עכשיו?'),
  A('להתחיל לחפור באתר כמובן &#x1F913;'),
  A('הנה כמה כיוונים מעניינים:'),
  A('<a target="_blank" href="/s/?q=%D7%94%D7%A8%D7%A9%D7%95%D7%AA%20%D7%9C%D7%97%D7%93%D7%A9%D7%A0%D7%95%D7%AA&dd=supports">' +
    'אילו סטארט-אפים מקבלים תמיכה מהמדען הראשי?' +
    '</a>?'),
  A('כמה תקציבים מקבלת' +
    '<a target="_blank" href="/i/org/municipality/500210315">' +
    ' העיר שדרות' +
    '</a>?' +
    ' ומה לגבי ' +
    '<a target="_blank" href="/i/org/municipality/500236112">' +
    'קרית ארבע' +
    '</a>?'),
  A('<a target="_blank" href="/s/?q=%D7%96%D7%94%D7%95%D7%AA%20%D7%99%D7%94%D7%95%D7%93%D7%99%D7%AA&dd=entities">' +
    'מהן העמותות המקדמות ׳זהות יהודית׳' +
    '</a>?'),
  A('<a target="_blank" href="/i/org/company/514628247">' +
    'כמה מכספי משלם המסים מקבל תיאטרון ״הבימה״' +
    '</a>?'),
  A('<a target="_blank" href="/s/?q=%D7%9E%D7%95%D7%A1%D7%93%D7%95%D7%AA%20%D7%AA%D7%95%D7%A8%D7%A0%D7%99%D7%99%D7%9D&dd=budget">' +
    'מה תקציב התמיכה בכוללים והישיבות' +
    '</a>?'),
  A('בהצלחה!!!'),
  Q('תודה! אלה היו חמש דקות ששינו את חיי &#x1F64F;'),
];

interface DialogBit {
  start: any[];
  adders: any[];
}

let dialogBits: Array<DialogBit> = [];
for (let i=0; i<dialog.length; i++) {
  if (dialog[i].direction == 'question') {
    if (i > 0 && dialog[i-1].direction  == 'question') {
      continue;
    }
    let bit = {
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
    j = i+1;
    while (j < dialog.length) {
      if (dialog[j].direction == 'answer') {
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
  selector: 'hero',
  template: require('./hero.html')
})
export class HeroComponent {

  @ViewChild('mushonkeyWrapper') mushonkeyComponentWrapper: ElementRef;
  @ViewChild('mushonkey') mushonkeyComponent: MushonkeyComponent;
  @ViewChild('hero') heroComponent: ElementRef;

  private ts: TransitionSteps;

  text: string = 'זה בעצם די פשוט&#8230;';
  textOpacity: number = 1;
  chart: MushonKeyChart;
  chartOpacity: number = 0;
  charts: Array<MushonKeyChart> = [];
  dialogLines: DialogElement[] = [];
  dialogOfs: number = 0;
  scroller = new EventEmitter<Number>();

  constructor(private mainPage: BudgetKeyMainPageService, private renderer: Renderer) {
    this.mainPage.getBubblesData().then((bubbles) => {
      this.makeDeficitCharts(bubbles.deficitChart);
      _.map(bubbles.educationCharts, (c) => this.makeEducationCharts(c));
      this.makeSupportChart(bubbles.supportChart[0], bubbles.supportChart[1]);
    });
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
          new TransitionStep([new UpdateMushonkey(++chartIdx),]),
          new TransitionStep([new UpdateMushonkey(++chartIdx),]),
          new TransitionStep([new UpdateMushonkey(++chartIdx),]),
          new TransitionStep([new UpdateMushonkey(++chartIdx),]),
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
            new ConnectorToSublevel('expenses', 4, true),
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
            new ConnectorToSublevel('expenses', 1, true),
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
            new ConnectorToSublevel('expenses', 2, true),
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

    this.renderer.listenGlobal('window', 'scroll',
    // document.onscroll =
      (ev: UIEvent) => {
      setTimeout(() => {
        let el = this.heroComponent.nativeElement;
        let rectTop = el.getBoundingClientRect().top;
        let offsetHeight = el.scrollHeight;
        if ((rectTop < 0) && (rectTop > -offsetHeight)) {
          let progress = -1 * rectTop / offsetHeight;
          this.scroller.emit(progress);
        } else if (rectTop > 0) {
          this.scroller.emit(0);
        } else {
          this.scroller.emit(1);
        }
      }, 10);
    });

    this.scroller.subscribe((progress: number) => {
      progress = 1.18*progress - 0.06;
      progress = progress < 0 ? 0 : progress;
      progress = progress > 1 ? 1 : progress;
      this.ts.mutate(this, progress);
    });
  }

  ngAfterViewInit(){
  }

  static makeFlow(amount: number, title: string, scale?: any) {
    scale = scale || [1000000000, "מיל'"];
    let billions = amount/scale[0];
    let digits = billions < 5 ? 1 : 0;
    let amountStr =  billions.toFixed(digits) + ' ' + scale[1];
    title = title + ' ' + amountStr;
    return new MushonKeyFlow(amount, title, null);
  }

  makeDeficitCharts(data: any) {

    let expenseChildren: Array<any> = _.sortBy(data.expenseChildren, (d: any) => -d.net_allocated)
    let semiExpenseRest = data.budget;
    let expenseRest = semiExpenseRest - _.sum(
        _.map(_.slice(expenseChildren, 1, 4),
          (d: any) => d.net_allocated)
    );

    let incomesFlowGroup = new MushonKeyFlowGroup(
      false, [
        HeroComponent.makeFlow(data.income, 'הכנסות המדינה')
      ], 'income', 20
    );
    let deficitFlowGroup = new MushonKeyFlowGroup(
      false, [
        HeroComponent.makeFlow(data.budget - data.income, 'הגירעון')
      ], 'deficit', -100, 0.7
    );

    let incomeChildren: Array<any> = _.sortBy(data.incomeChildren, (d: any) => -d.net_allocated)
    let kidsNum = [1,2,3,4];

    let expandedIncomesFlowGroup = _.map(kidsNum, (k) => {
      let incomeRest = data.income - _.sum(
        _.map(_.slice(incomeChildren, 0, k),
          (d: any) => d.net_allocated)
      );
      let flows = [];
      for (let i = 0 ; i < k ; i++ ) {
        flows.push(HeroComponent.makeFlow(incomeChildren[i].net_allocated, incomeChildren[i].title))
      }
      if (k != 4) {
        flows.push(HeroComponent.makeFlow(incomeRest, '...'));
      }
      return new MushonKeyFlowGroup(
        false, flows, 'income', 20
      );
    });
    let expensesFlowGroup = new MushonKeyFlowGroup(
      true, [
        HeroComponent.makeFlow(data.budget + data.returns, 'הוצאות הממשלה')
      ], 'expenses', 20
    );
    let debtFlowGroup = new MushonKeyFlowGroup(
      true, [
        HeroComponent.makeFlow(data.returns, 'החזר חובות'),
      ], 'debt', -100, 0.7
    );
    let semiExpandedExpensesFlowGroup = new MushonKeyFlowGroup(
      true, [
        HeroComponent.makeFlow(semiExpenseRest, 'הוצאות משרדי הממשלה')
      ], 'expenses', 20
    );
    let expandedExpensesFlowGroup = new MushonKeyFlowGroup(
      true, [
        HeroComponent.makeFlow(expenseChildren[1].net_allocated, expenseChildren[1].title),
        HeroComponent.makeFlow(expenseChildren[2].net_allocated, expenseChildren[2].title),
        HeroComponent.makeFlow(expenseChildren[3].net_allocated, expenseChildren[3].title),
        HeroComponent.makeFlow(expenseRest, 'משרדי ממשלה אחרים')
      ], 'expenses', 20
    );

    const margin = {top: 20, left: 20, right: 20, bottom: 20};
    const centerVerticalOffset = 100;
    this.charts.push(new MushonKeyChart([
      ],
      'תקציב המדינה',
      200, 80, true, margin, centerVerticalOffset
    ));
    this.charts.push(new MushonKeyChart([
        incomesFlowGroup,
      ],
      'תקציב המדינה',
      200, 80, true, margin, centerVerticalOffset
    ));
    this.charts.push(new MushonKeyChart([
        incomesFlowGroup,
        expensesFlowGroup,
      ],
      'תקציב המדינה',
      200, 80, true, margin, centerVerticalOffset
    ));
    this.charts.push(new MushonKeyChart([
        expensesFlowGroup,
        expandedIncomesFlowGroup[0],
      ],
      'תקציב המדינה',
      200, 80, true, margin, centerVerticalOffset
    ));
    this.charts.push(new MushonKeyChart([
        expensesFlowGroup,
        expandedIncomesFlowGroup[1],
      ],
      'תקציב המדינה',
      200, 80, true, margin, centerVerticalOffset
    ));
    this.charts.push(new MushonKeyChart([
        expensesFlowGroup,
        expandedIncomesFlowGroup[2],
      ],
      'תקציב המדינה',
      200, 80, true, margin, centerVerticalOffset
    ));
    this.charts.push(new MushonKeyChart([
        expensesFlowGroup,
        expandedIncomesFlowGroup[3],
      ],
      'תקציב המדינה',
      200, 80, true, margin, centerVerticalOffset
    ));
    this.charts.push(new MushonKeyChart([
        deficitFlowGroup,
        expensesFlowGroup,
        expandedIncomesFlowGroup[3],
      ],
      'תקציב המדינה',
      200, 80, true, margin, centerVerticalOffset
    ));
    this.charts.push(new MushonKeyChart([
        deficitFlowGroup,
        debtFlowGroup,
        semiExpandedExpensesFlowGroup,
        expandedIncomesFlowGroup[3],
      ],
      'תקציב המדינה',
      200, 80, true, margin, centerVerticalOffset
    ));
    this.charts.push(new MushonKeyChart([
        deficitFlowGroup,
        debtFlowGroup,
        expandedExpensesFlowGroup,
        expandedIncomesFlowGroup[3],
      ],
      'תקציב המדינה',
      200, 80, true, margin, centerVerticalOffset
    ));

  }

  makeEducationCharts(data: any) {
    let numToShow = 5;
    let children: Array<any> = _.sortBy(data.children, (d: any) => -d.net_allocated);
    let rest = data.net_allocated - _.sum(
        _.map(_.slice(children, 0, numToShow),
          (d: any) => d.net_allocated)
      );
    let flows = [];
    for (let i = 0 ; i < numToShow ; i++ ) {
      flows.push(HeroComponent.makeFlow(children[i].net_allocated, children[i].title));
    }
    flows.push(HeroComponent.makeFlow(rest, 'אחרים...'));
    let chart = new MushonKeyChart([
        new MushonKeyFlowGroup(
          true, flows, 'expenses', 20
        ),
        new MushonKeyFlowGroup(
          false, [
            HeroComponent
              .makeFlow(data.net_allocated,
                '…' + 'מתוך תקציב ' + data.hierarchy[data.hierarchy.length-1][1] + ': ')
          ], 'income', -100
        ),
      ],
      data.title + ' '+data['nice-code'],
      200, 80, true, {top: 20, left: 20, right: 20, bottom: 20}
    );
    console.log(data);
    this.charts.push(chart);
  }

  makeSupportChart(supportData: any, budgetData: any) {
    console.log(supportData);
    console.log(budgetData);
    let numToShow = 5;
    let children: Array<any> = _.sortBy(supportData, (d: any) => -d.total_amount);
    let total = _.sum(_.map(children, (d) => d.total_amount));
    let rest = total - _.sum(
        _.map(_.slice(children, 0, numToShow),
          (d: any) => d.total_amount)
      );
    let scale = [1000000, 'מיליון ₪']
    let flows = [];
    for (let i = 0 ; i < numToShow ; i++ ) {
      flows.push(HeroComponent.makeFlow(children[i].total_amount, children[i].entity_name, scale));
    }
    flows.push(HeroComponent.makeFlow(rest, 'אחרים...', scale));
    let group = new MushonKeyFlowGroup(
      true, flows, 'supports', 20
    );
    group.labelTextSize = 12;
    let chart = new MushonKeyChart([
        group,
        new MushonKeyFlowGroup(
          false, [
            HeroComponent
              .makeFlow(budgetData.net_allocated,
                '…' + 'מתוך תקציב ' + budgetData.hierarchy[budgetData.hierarchy.length-1][1] + ': ',
              scale)
          ], 'income', -100
        ),
      ],
      budgetData.title + ' '+budgetData['nice-code'],
      200, 80, true, {top: 20, left: 20, right: 20, bottom: 20}
    );
    this.charts.push(chart);
  }

}
