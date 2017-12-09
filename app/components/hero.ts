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
}


class TransitionStep implements Mutator {
  private start: number;
  private stop: number;
  private active = false;

  constructor(private _duration: number,
              private _mutators: Array<Mutator>) {}

  get duration() { return this._duration };

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

class TransitionSteps implements Mutator {
  constructor(private _steps: Array<TransitionStep>) {
    let totalLength = d3.sum(_steps, (s) => s.duration);
    let ofs = 0;
    for (let step of _steps) {
      step.setRange(ofs/totalLength, (ofs + step.duration)/totalLength);
      ofs += step.duration;
    }
  }

  mutate(hero: HeroComponent, t: number): void {
    for (let s of this._steps) {
      s.mutate(hero, t);
    }
  }
}

class HiglightText implements Mutator {
  constructor(private text: string,
              private ease?: any) {
    this.ease = ease || tweenie;
  }

  mutate(hero: HeroComponent, t: number): void {
    hero.text = this.text;
    hero.textOpacity = this.ease(t);
    console.log('HiglightText', t, hero.textOpacity);
  }
}

class UpdateMushonkey implements Mutator {
  constructor(private index: number) {}

  mutate(hero: HeroComponent, t: number): void {
    hero.chart = hero.charts[this.index];
    if (hero.mushonkeyComponent) {
      hero.mushonkeyComponent.updateChart(hero.chart);
    }
  }
}

class ChartIntroduce implements Mutator {
  constructor(private increasing: boolean) {}

  mutate(hero: HeroComponent, t: number): void {
    hero.chartOpacity = d3.easeExpOut(this.increasing? t : 1-t);
    console.log('ChartIntroduce', this.increasing, hero.chartOpacity);
  }
}


class ConnectorIntroduce implements Mutator {
  constructor(private klass: string) {}

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

class ConnectorToSublevel implements Mutator {
  constructor(private klass: string, private index: number) {}

  mutate(hero: HeroComponent, t: number): void {
    let connectors: Array<SVGElement> = hero.mushonkeyComponentWrapper.nativeElement.querySelectorAll('path');
    connectors = Array.from(connectors);
    connectors = connectors.filter((c) => c.classList.contains(this.klass));
    let connector = connectors[this.index];
    if (connector) {
      let gap = t * 200;
      if (gap > 20) {
        gap = 20;
      }
      console.log('ConnectorToSublevel', t, gap);
      connector.style.strokeDasharray = '10,'+gap;
      connector.style.strokeDashoffset = '-'+(50*t);
    }
  }
}


@Component({
  selector: 'hero',
  template: require('./hero.html')
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

  constructor(private mainPage: BudgetKeyMainPageService,
              private scroller: ScrollyService) {
    this.mainPage.getBubblesData().then((bubbles) => {
      this.makeDeficitCharts(bubbles.deficitChart);
      _.map(bubbles.educationCharts, (c) => this.makeEducationCharts(c));
    });
    this.ts = new TransitionSteps([
      new TransitionStep(5, [
        new HiglightText('זה בעצם די פשוט&#8230;', (t: number) => d3.easePolyInOut(1-t)),
        new ChartIntroduce(true),
        new UpdateMushonkey(0),
      ]),
      new TransitionStep(5, [
        new HiglightText('מצד אחד נכנס כסף - הכנסות'),
        new UpdateMushonkey(1),
        new ConnectorIntroduce('income'),
      ]),
      new TransitionStep(5, [
        new HiglightText('ומהצד השני יוצא כסף - הוצאות'),
        new UpdateMushonkey(2),
        new ConnectorIntroduce('expenses'),
      ]),
      new TransitionStep(5, [
        new HiglightText('מאיפה מגיע הכסף לתקציב המדינה?')
      ]),
      new TransitionStep(5, [
        new HiglightText('יש לא מעט מקורות, אבל הנה העיקריים מביניהם')
      ]),
      new TransitionStep(5, [
        new UpdateMushonkey(3),
      ]),
      new TransitionStep(5, [
        new HiglightText(`
           האם סך ההכנסות שווה לסך ההוצאות? לא בדיוק...
           <br/>
           כל שנה הממשלה מוציאה קצת יותר כסף ממה שנכנס,
           <br/>
           אבל אנחנו לא נכנסים למינוס - כי האוכלוסיה גדלה, המשק צומח וההכנסות של השנה אחרי מכסות את הפער.
        `),
      ]),
      new TransitionStep(5, [
        new HiglightText('להפרש בין ההוצאות להכנסות קוראים ״גירעון״.')
      ]),
      new TransitionStep(5, [
        new UpdateMushonkey(4),
        new ConnectorIntroduce('deficit'),
      ]),
      new TransitionStep(5, [
        new HiglightText('בצד ההוצאות אנו מפרידים בין החזר החובות לכל שאר ההוצאות')
      ]),
      new TransitionStep(5, [
        new UpdateMushonkey(5),
        new ConnectorIntroduce('debt'),
      ]),
      new TransitionStep(5, [
        new HiglightText('זאת מכיוון שעל התקציב ל״שאר ההוצאות״ חלות מגבלות המונעות ממנו לגדול - גם אם יש כסף בקופה.')
      ]),
      new TransitionStep(5, [
        new HiglightText('באופן כללי, התקציב מאורגן לפי משרדי הממשלה השונים.')
      ]),
      new TransitionStep(5, [
        new HiglightText('לכל משרד יש תקציב משלו, המתחלק בין היחידות השונות בתוך המשרד - וכן הלאה.')
      ]),
      new TransitionStep(5, [
        new UpdateMushonkey(6),
      ]),
      new TransitionStep(5, [
        new HiglightText(`
        זאת הסיבה שאם רוצים לדעת כמה כסף ״הולך לפריפריה״ או ״להתנחלויות״ או ״לערבים״ או ״לחרדים״
        <br/>
        <small>(ואנחנו מקבלים הרבה שאלות כאלו&#8230;)</small>
        <br/>
        אז אין תשובה מוחלטת - כי אין ״משרד הפריפריה״ או ״משרד החרדים״ בממשלה`)
      ]),
      new TransitionStep(5, [
        new HiglightText('לשם הדוגמה, בוא נצלול לתוך תקציב משרד החינוך'),
        new ConnectorToSublevel('expenses', 0)
      ]),
      new TransitionStep(5, [
        new HiglightText('לשם הדוגמה, בוא נצלול לתוך תקציב משרד החינוך'),
        new ConnectorToSublevel('expenses', 0),
        new ChartIntroduce(false)
      ]),
      new TransitionStep(5, [
        new ChartIntroduce(true),
        new UpdateMushonkey(7),
      ]),
      new TransitionStep(5, [
        new ChartIntroduce(false),
      ]),
      new TransitionStep(5, [
        new ChartIntroduce(true),
        new UpdateMushonkey(8),
      ]),
      new TransitionStep(5, [
        new ChartIntroduce(false),
      ]),
      new TransitionStep(5, [
        new ChartIntroduce(true),
        new UpdateMushonkey(9),
      ]),
      new TransitionStep(5, [
        new ChartIntroduce(false),
      ]),
      new TransitionStep(5, [
        new ChartIntroduce(true),
        new UpdateMushonkey(10),
      ]),
      new TransitionStep(5, [
        new ChartIntroduce(false),
      ]),
    ]);
    this.scroller.subscribe(this);
  }

  onScrolly(id: string, progress: number) {
    if (id == 'hero') {
      this.ts.mutate(this, progress);
    }
  }

  ngAfterViewInit(){
  }

  static makeFlow(amount: number, title: string) {
    let billions = amount/1000000000;
    let digits = billions < 5 ? 1 : 0;
    let amountStr =  billions.toFixed(digits) + ' מיל׳';
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
    let children: Array<any> = _.sortBy(data.children, (d: any) => -d.net_allocated)
    let rest = data.net_allocated - _.sum(
        _.map(_.slice(children, 0, 4),
          (d: any) => d.net_allocated)
      );
    let chart = new MushonKeyChart([
        new MushonKeyFlowGroup(
          true, [
            HeroComponent.makeFlow(children[0].net_allocated, children[0].title),
            HeroComponent.makeFlow(children[1].net_allocated, children[1].title),
            HeroComponent.makeFlow(children[2].net_allocated, children[2].title),
            HeroComponent.makeFlow(children[3].net_allocated, children[3].title),
            HeroComponent.makeFlow(rest, 'אחרים...')
          ], 'expenses', 20
        ),
        new MushonKeyFlowGroup(
          false, [
            HeroComponent
              .makeFlow(data.net_allocated,
                '…' + 'מתוך תקציב ' + data.hierarchy[data.hierarchy.length-1][1] + ': ')
          ], 'income', -100
        ),
      ],
      data.title,
      200, 80, true, {top: 20, left: 20, right: 20, bottom: 20}
    );
    this.charts.push(chart);
  }

}

/*
מאיפה מגיע הכסף לתקציב המדינה?
יש לא מעט מקורות, אבל הנה העיקריים מביניהם
     (1) מס הכנסה (ובתוכו בעיקר מס חברות), (2) גיוסים בשוק ההון (מלוות)  ו(3) מע״מ.

האם סך ההכנסות שווה לסך ההוצאות? לא בדיוק...
כל שנה הממשלה מוציאה קצת יותר כסף ממה שנכנס,
אבל אנחנו לא נכנסים למינוס - כי האוכלוסיה גדלה, המשק צומח וההכנסות של השנה אחרי מכסות את הפער.

להפרש בין ההוצאות להכנסות קוראים ״גירעון״.

בצד ההוצאות אנו מפרידים בין החזר החובות לכל שאר ההוצאות.
זאת מכיוון שעל התקציב ל״שאר ההוצאות״ חלות מגבלות המונעות ממנו לגדול - גם אם יש כסף בקופה.

באופן כללי, התקציב מאורגן לפי משרדי הממשלה השונים. לכל משרד יש תקציב משלו, המתחלק בין היחידות השונות בתוך המשרד וכן הלאה.
זאת הסיבה שאם רוצים לדעת כמה כסף ״הולך לפריפריה״ או ״להתנחלויות״ או ״לערבים״ או ״לחרדים״
(ואנחנו מקבלים הרבה שאלות כאלו&#8230;)
אז אין תשובה מוחלטת - כי אין ״משרד הפריפריה״ או ״משרד החרדים״ בממשלה.
<br/>
אז מה קורה בתוך המשרדים עצמם? בוא נצלול לתקציב משרד החינוך&#8230;
</span>
</div>
<div class="mushonkey-wrapper">
<mushonkey [chart]="educationCharts[0]" *ngIf="educationCharts"></mushonkey>
</div>
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