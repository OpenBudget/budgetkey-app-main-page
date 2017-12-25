import { Component, Input, Inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import * as _ from 'lodash';
import * as d3 from 'd3';
import { ScrollyService } from '../services';
import {ScrollyListener} from "../services/scrolly";
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
  constructor(private bit: DialogBit) {
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
      hero.dialogOfs = tofs * 58.0;
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
  constructor(private klass: string) {
    super();
  }

  mutate(hero: HeroComponent, t: number): void {
    t = d3.easePolyInOut(t);
    let connectors: Array<SVGElement> = hero.mushonkeyComponentWrapper.nativeElement.querySelectorAll('path');
    for (let connector of connectors) {
      if (connector.classList.contains(this.klass)) {
        let cr = connector.getBoundingClientRect();
        let length = cr.width + cr.height;
        connector.style.strokeDasharray = length+',100000';
        connector.style.strokeDashoffset = ''+((1-t)*length);
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
  A('יש לא מעט מקורות, אבל הנה העיקריים מביניהם'),
  A('מס הכנסה (ובתוכו בעיקר מס חברות)'),
  A('גיוסים בשוק ההון (מלוות)'),
  A('מע״מ'),
  Q('ואז את כל הכסף שנכנס אפשר לבזבז!'),
  A('הממ... לא בדיוק'),
  A('כל שנה הממשלה מוציאה קצת יותר כסף ממה שנכנס'),
  Q('אז איך אנחנו לא נכנסים למינוס?'),
  A('כי האוכלוסיה גדלה, המשק צומח וההכנסות של השנה אחרי מכסות את הפער.'),
  A('דרך אגב,'),
  A('ההפרש בין ההוצאות להכנסות נקרא ה״גירעון״.'),
  Q('אוקיי.. מה עושים עם כל הכסף הזה? בטוח שהרוב הולך לביטחון, נכון?'),
  A('דווקא לא - ההוצאה הכי גדולה בתקציב היא החזר חובות.'),
  Q('ולמה החזר החובות צבוע בצבע אחר?'),
  A('בצד ההוצאות אנו מפרידים בין החזר החובות לכל שאר ההוצאות'),
  A('זאת מכיוון שעל התקציב ל״שאר ההוצאות״ יש הגבלות המונעות ממנו לגדול - גם אם יש כסף בקופה.'),
  Q('טוב, חוץ מהחזר חובות, מה עוד יש בתקציב?'),
  Q('איפה החרדים?'),
  Q('ההתנחלויות?'),
  Q('הערבים?'),
  Q('הפריפריה???'),
  A('רגע, רגע!'),
  A('באופן כללי, התקציב מאורגן לפי משרדי הממשלה השונים.'),
  A('לכל משרד יש תקציב משלו, המתחלק בין היחידות השונות בתוך המשרד - וכן הלאה.'),
  A('כך שאם רוצים לדעת כמה כסף ״הולך לפריפריה״ או ״להתנחלויות״ או ״לערבים״ או ״לחרדים״'),
  A('אז אין תשובה מוחלטת - כי אין ״משרד הפריפריה״ או ״משרד החרדים״ בממשלה'),
  Q('נראה לי שהגיע הזמן לדוגמה' +
    ' &#x1F605;'),
  A('בהחלט. לשם הדוגמה, בוא נצלול לתוך תקציב משרד החינוך'),
  A('מעל 56 מיליארד שקלים מתוך תקציב המדינה יגיעו למשרד החינוך ב-2018'),
  Q('הבנתי... אז לכל משרד בממשלה יש תקציב משל עצמו?'),
  A('כן, למרבית המשרדים הגדולים יש סעיף תקציבי משל עצמם'),
  A('אבל לא לכל המשרדים הקטנים '),
  Q('ואיך מחלקים את הכסף בתוך המשרד?'),
  A('בתוך המשרד, התקציב מחולק לפי הנושאים הגדולים בהם הוא מטפל'),
  Q('מה זה ״תכניות לימודים משלימות״?'),
  A('שאלה טובה... בוא נבדוק!'),
  Q('וואו, יש כאן המון דברים!'),
  A('כן, כ-4 מיליארד שקלים מתוך תקציב משרד החינוך משמשים לתכניות לימודים משלימות'),
  Q('מעניין, מה זה המספר הזה שיש לכל סעיף תקציבי?'),
  A('הבחנה טובה!'),
  A('באמת לכל סעיף תקציבי יש מספר - ככל שהסעיף יותר מפורט, המספר יותר ארוך'),
  Q('אז מה עוד יש כאן? מה זה חינוך בלתי פורמאלי?'),
  A('והנה התשובה :)'),
  Q('התקציב הזה באמת מאוד מפורט'),
  A('כמעט מיליארד שקלים מתוך תקציב תכניות הלימודים המשלימות משמשים לחינוך בלתי פורמאלי'),
  A('סעיפי התקציב שברמה הזאת נקראים ״תכניות״'),
  A('כאשר עושים שינויים בתקציב במהלך השנה - מעבירים כסף מתכנית אחת לתכנית אחרת.'),
  Q('זה קורה הרבה?'),
  A('במהלך השנה יכולים להיות אלפים של שינויים כאלה'),
  A('שלפעמים משנים באופן מהותי חלקים משמעותיים בתקציב!'),
  Q('לא יאומן'),
  A('שנבדוק מה קורה בתוך ״תמיכה בתנועות נוער״?'),
  Q('קדימה!'),
  A('כמעט מיליון שקל מוקצה תקציב המדינה לתמיכה בתנועות נוער'),
  A('הגענו!'),
  Q('לאן?'),
  A('זאת הרמה הכי מפורטת של התקציב'),
  A('נקראת גם תקנה תקציבית'),
  Q('אז מה קורה עם הכסף מכאן?'),
  A('מכאן והלאה הכסף יוצא החוצה'),
  A('כמשכורת, קניות או - במקרה שלנו'),
  A('דרך תמיכה בארגונים שונים'),
  A('כמו הנוער העובד והלומד'),
  A('הצופים'),
  A('או תנועת בני-עקיבא'),
  Q('נראה לי שהבנתי את הרוב &#x1F60E;'),
  Q('מה כדאי לי לעשות עכשיו?'),
  A('להתחיל לחפור באתר כמובן &#x1F913;'),
  A('הנה כמה כיוונים מעניינים:'),
  A('אילו עמותות של ׳זהות יהודית׳ הפועלות במערכת החינוך?'),
  A('מה תקציב התמיכה בכוללים והישיבות?'),
  A('אילו סטארט-אפים מקבלים תמיכה מהמדען הראשי?'),
  A('כמה תקציבים מקבלת העיר שדרות? ומה לגבי קרית ארבע?'),
  A('כמה מכספי משלם המסים מקבל תיאטרון ״הבימה״?'),
  A('בהצלחה!!!'),
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
  template: require('./hero.html'),
  styles: [`
    .graph-bg {
        background-image: linear-gradient(90deg, rgba(110, 196, 190, 0.2) 1px, transparent 1px), linear-gradient(rgba(110, 196, 190, 0.2) 1px, transparent 1px);
        background-size: 20px 20px;
    }
`]
})
export class HeroComponent implements ScrollyListener {

  @ViewChild('mushonkeyWrapper') mushonkeyComponentWrapper: ElementRef;
  @ViewChild('mushonkey') mushonkeyComponent: MushonkeyComponent;

  private ts: TransitionSteps;

  text: string = 'זה בעצם די פשוט&#8230;';
  textOpacity: number = 1;
  chart: MushonKeyChart;
  chartOpacity: number = 0;
  charts: Array<MushonKeyChart> = [];
  dialogLines: DialogElement[] = [];
  dialogOfs: number = 0;

  constructor(private mainPage: BudgetKeyMainPageService,
              private scroller: ScrollyService) {
    this.mainPage.getBubblesData().then((bubbles) => {
      this.makeDeficitCharts(bubbles.deficitChart);
      _.map(bubbles.educationCharts, (c) => this.makeEducationCharts(c));
      this.makeSupportChart(bubbles.supportChart[0], bubbles.supportChart[1]);
    });
    this.ts = new TransitionSteps([
      new TransitionStep([
        // new HiglightText('זה בעצם די פשוט&#8230;', (t: number) => d3.easePolyInOut(1-t)),
        new ShowDialogBit(dialogBits[0]),
        new TransitionSteps([
          new TransitionStep([
            new ChartIntroduce(true),
            new UpdateMushonkey(0),
          ]),
          new TransitionStep([
            new UpdateMushonkey(1),
            new ConnectorShow(),
            new ConnectorIntroduce('income'),
            new ChartShow(),
          ]),
          new TransitionStep([
            new UpdateMushonkey(2),
            new ChartShow(),
            new ConnectorShow(),
            new ConnectorIntroduce('expenses'),
          ]),
        ])
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[1]),
        new TransitionSteps([
          new TransitionStep([
            new ChartShow(),
            new ConnectorShow(),
          ]),
          new TransitionStep([new UpdateMushonkey(3),]),
        ])
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[2]),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[3]),
        new UpdateMushonkey(4),
        new ChartShow(),
        new ConnectorShow(),
        new ConnectorIntroduce('deficit'),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[4]),
        new UpdateMushonkey(5),
        new ChartShow(),
        new ConnectorShow(),
        new ConnectorIntroduce('debt'),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[5]),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[6]),
        new TransitionSteps([
          new TransitionStep([
            new ChartShow(),
            new ConnectorShow(),
          ]),
          new TransitionStep([
            new UpdateMushonkey(6),
          ])
        ])
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[7]),
        new TransitionSteps([
          new TransitionStep([
            new BaseMutator(),
          ]),
          new TransitionStep([
            new BaseMutator(),
          ]),
          new TransitionStep([
            new ConnectorShow(),
            new ConnectorToSublevel('expenses', 0, true),
            new ChartIntroduce(false)
          ]),
          new TransitionStep([
            new ChartIntroduce(true),
            new UpdateMushonkey(7),
            new ConnectorShow(),
            new ConnectorToSublevel('income', 0, false),
          ])
        ])
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[8]),
        new UpdateMushonkey(7),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[9]),
        new UpdateMushonkey(7),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[10]),
        new TransitionSteps([
          new TransitionStep([
            new UpdateMushonkey(7),
            new ConnectorToSublevel('expenses', 4, true),
            new ChartIntroduce(false),
          ]),
          new TransitionStep([
            new ChartIntroduce(true),
            new UpdateMushonkey(8),
            new ConnectorToSublevel('income', 0, false),
          ]),
        ])
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[11]),
        new UpdateMushonkey(8),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[12]),
        new UpdateMushonkey(8),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[13]),
        new TransitionSteps([
          new TransitionStep([
            new UpdateMushonkey(8),
            new ConnectorToSublevel('expenses', 1, true),
            new ChartIntroduce(false),
          ]),
          new TransitionStep([
            new ChartIntroduce(true),
            new UpdateMushonkey(9),
            new ConnectorToSublevel('income', 0, false),
          ]),
        ])
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[14]),
        new UpdateMushonkey(9),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[15]),
        new UpdateMushonkey(9),
      ]),
      new TransitionStep([
        new ShowDialogBit(dialogBits[16]),
        new TransitionSteps([
          new TransitionStep([
            new UpdateMushonkey(9),
          ]),
          new TransitionStep([
            new UpdateMushonkey(9),
          ]),
          new TransitionStep([
            new UpdateMushonkey(9),
          ]),
          new TransitionStep([
            new UpdateMushonkey(9),
            new ConnectorToSublevel('expenses', 2, true),
            new ChartIntroduce(false),
          ]),
          new TransitionStep([
            new ChartIntroduce(true),
            new UpdateMushonkey(10),
            new ConnectorToSublevel('income', 0, false),
          ]),
        ])
      ]),
      new TransitionStep([
        new UpdateMushonkey(10),
        new ShowDialogBit(dialogBits[17]),
      ]),
      new TransitionStep([
        new UpdateMushonkey(10),
        new ShowDialogBit(dialogBits[18]),
      ]),
      new TransitionStep([
        new UpdateMushonkey(10),
        new ShowDialogBit(dialogBits[19]),
      ]),
      new TransitionStep([
        new UpdateMushonkey(10),
        new ChartIntroduce(false),
      ]),
      new TransitionStep([
        new ChartShow(0.01),
        new ShowDialogBit(dialogBits[20]),
      ]),
    ]);
    this.scroller.subscribe(this);
  }

  onScrolly(id: string, progress: number) {
    if (id == 'hero') {
      progress = 1.12*progress - 0.06;
      progress = progress < 0 ? 0 : progress;
      progress = progress > 1 ? 1 : progress;
      this.ts.mutate(this, progress);
    }
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
    let semiExpenseRest = data.budget - expenseChildren[0].net_allocated;
    let expenseRest = data.budget - _.sum(
        _.map(_.slice(expenseChildren, 0, 4),
          (d: any) => d.net_allocated)
      );
    let incomeChildren: Array<any> = _.sortBy(data.incomeChildren, (d: any) => -d.net_allocated)
    let incomeRest = data.income - _.sum(
        _.map(_.slice(incomeChildren, 0, 3),
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
    let expandedIncomesFlowGroup = new MushonKeyFlowGroup(
      false, [
        HeroComponent.makeFlow(incomeChildren[0].net_allocated, incomeChildren[0].title),
        HeroComponent.makeFlow(incomeChildren[1].net_allocated, incomeChildren[1].title),
        HeroComponent.makeFlow(incomeChildren[2].net_allocated, incomeChildren[2].title),
        HeroComponent.makeFlow(incomeRest, 'הכנסות אחרות')
      ], 'income', 20
    );
    let expensesFlowGroup = new MushonKeyFlowGroup(
      true, [
        HeroComponent.makeFlow(data.budget, 'הוצאות הממשלה')
      ], 'expenses', 20
    );
    let debtFlowGroup = new MushonKeyFlowGroup(
      true, [
        HeroComponent.makeFlow(expenseChildren[0].net_allocated, expenseChildren[0].title),
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
        expandedIncomesFlowGroup,
      ],
      'תקציב המדינה',
      200, 80, true, margin, centerVerticalOffset
    ));
    this.charts.push(new MushonKeyChart([
        deficitFlowGroup,
        expensesFlowGroup,
        expandedIncomesFlowGroup,
      ],
      'תקציב המדינה',
      200, 80, true, margin, centerVerticalOffset
    ));
    this.charts.push(new MushonKeyChart([
        deficitFlowGroup,
        debtFlowGroup,
        semiExpandedExpensesFlowGroup,
        expandedIncomesFlowGroup,
      ],
      'תקציב המדינה',
      200, 80, true, margin, centerVerticalOffset
    ));
    this.charts.push(new MushonKeyChart([
        deficitFlowGroup,
        debtFlowGroup,
        expandedExpensesFlowGroup,
        expandedIncomesFlowGroup,
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

/*
<div class="description">
  <span>
    מעל 56 מיליארד שקלים מתוך תקציב המדינה יגיעו למשרד החינוך ב-2018.
<br/>
למשרד החינוך יש סעיף תקציבי משל עצמו, שנקרא
<code>20</code>.
<br/>
למרבית המשרדים הגדולים יש סעיף תקציבי כזה - בעוד שלמשרדים קטנים לרוב אין, והם מוצמדים למשרד אחר.
<br/>
בתוך משרד החינוך, התקציב מחולק לפי הנושאים הגדולים בהם המשרד מטפל, שהן שכבות הגיל השונות.
<br/>
נתמקד בשכבה שמקבלת הכי הרבה כסף - בתי ספר יסודיים וחטיבות ביניים&#8230;
</span>
</div>

<div class="mushonkey-wrapper">
<mushonkey [chart]="educationCharts[1]" *ngIf="educationCharts"></mushonkey>
</div>

<div class="description">
  <span>
    מעל 15 מיליארד שקלים מתוך תקציב משרד החינוך יגיעו ב-2018 לתחום החינוך היסודי וחטיבות הביניים.
<br/>
גם לתחום הזה יש מספר משלו, והוא
<code>20.43</code>.
<br/>
המספרים הללו חשובים, שכן הם מאפשרים לנו לזהות את הסעיפים התקציביים בצורה מדויקת. מכיוון שגם הסעיפים הכי קטנים מכילים עשרות מיליונים של שקלים, דיוק הוא די הכרחי כאן.
<br/>
מתוך תקציב החינוך היסודי, אפשר לראות שהתקציב מחולק לפי הזרמים השונים בחינוך - הרוב לחינוך הרשמי והשאר לזרמים העצמאיים.
<br/>
נתמקד בזרם שמקבל הכי הרבה כסף - החינוך הרשמי&#8230;
</span>
</div>

<div class="mushonkey-wrapper">
<mushonkey [chart]="educationCharts[2]" *ngIf="educationCharts"></mushonkey>
</div>

<div class="description">
  <span>
    מעל 8 מיליארד שקלים מתוך תקציב החינוך היסודי וחטיבות הביניים יגיעו ב-2018 לחינוך הרשמי.
<br/>
ברמה הזאת, סעיפי התקציב נקראים ״תכניות״. המספר של התכנית הזו הוא
<code>20.43.01</code>.
<br/>
כאשר עושים העברות תקציביות - שינויים בתקציב במהלך השנה - מה שעושים לרוב זה להעביר כסף בין תכנית אחת לתכנית אחרת.
  במהלך השנה יכולים להיות אלפים של שינויים כאלה - שלפעמים משנים באופן מהותי חלקים משמעותיים בתקציב.
</span>
</div>
<div class="description">
  <span>
    כל תכנית מכילה בתוכה מספר תקנות תקציביות.
<br/>
כל תקנה מגדירה סכום כסף שהמדינה החליטה להוציא עבור פעילות בודדת כלשהי -
ובאיזה דרך היא תוציא אותו.
<br/>
במקרה שלנו, התקנה ״שעות תקן ביסודי״ (מספר
<code>20.43.01.01</code>) היא תקנה המשמשת לתשלום משכורות למורים.
</span>
</div>
<div class="description">
  <span>
    דרכים נוספות שבהן המדינה מוציאה כסף (פרט למשכורות) הן
תמיכה כלכלית (ברשויות מקומיות, אנשים וארגונים) וקניית מוצרים או שירותים.
<br/>
במבט על נוכל להתרשם באיזה אופן המדינה משתמשת בתקציב:
  </span>
  </div>
`
*/
