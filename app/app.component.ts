import { Component } from '@angular/core';
import { BudgetKeyMainPageService } from './services';
import {ScrollyService} from "./services/scrolly";
import {MushonKeyChart, MushonKeyFlowGroup, MushonKeyFlow} from "mushonkey/lib/components/MushonkeyComponent";
import * as _ from 'lodash';

@Component({
  selector: 'my-app',
  template: `
      <budgetkey-container>
        <div class="container-fluid">
          <budgetkey-main-page-header></budgetkey-main-page-header>
          <budgetkey-main-page-summary [amount]="totalAmount" [year]="year"></budgetkey-main-page-summary>
          <div class="text-center">
            <div class="description">
               <span>
               התקציב משמש למגוון מטרות, לפי ראות עיניהן של הממשלה והכנסת.
               <br/>
                ניתן לראות שהנושאים הגדולים ביותר הם:
               <br/>
                 (1) השרותים החברתיים, (2) החזר החובות ו-(3) הביטחון.
               <br/>
               כל נושא כזה מורכב מנושאי משנה. כך למשל, השרותים החברתיים כוללים את החינוך, הבריאות, הביטוח הלאומי ועוד
               <br/>
               כל תת-נושא בסופו של דבר מטופל על ידי משרד ממשלתי אחד (או יותר)
               <br/>         
               <small>
               עברו עם העכבר על הבועות בשביל ללמוד עוד
               </small>
               </span>
            </div>
            <category-visualization *ngFor="let category of funcCategories"
                  [category]="category"></category-visualization>
            <div class="description">
               <span>            
               מאיפה מגיע הכסף לתקציב המדינה?
               <br/>
               יש לא מעט מקורות, אבל אפשר לראות שהעיקריים הם
               <br/>
                (1) מס הכנסה (ובתוכו בעיקר מס חברות), (2) גיוסים בשוק ההון (מלוות)  ו(3) מע״מ.
               </span>
            </div>
            <category-visualization *ngFor="let category of incomeCategories"
              [category]="category"></category-visualization>
            <div class="description">
               <span>            
               האם סך ההכנסות שווה לסך ההוצאות? לא בדיוק...
               <br/>
               כל שנה הממשלה מוציאה קצת יותר כסף ממה שנכנס,  
               <br/>
               אבל אנחנו לא נכנסים למינוס - כי האוכלוסיה גדלה, המשק צומח וההכנסות של השנה אחרי מכסות את הפער.
               <br/>
               להפרש בין ההוצאות להכנסות קוראים ״גירעון״. 
               </span>
            </div>
            <div class="mushonkey-wrapper">
                <mushonkey [chart]="deficitChart" *ngIf="deficitChart"></mushonkey>           
            </div>
            <div class="description">
               <span>            
                 בצד ההוצאות אנו מפרידים בין החזר החובות לכל שאר ההוצאות.
                 <br/>
                 זאת מכיוון שעל התקציב ל״שאר ההוצאות״ חלות מגבלות המונעות ממנו לגדול - גם אם יש כסף בקופה.  
                 <br/>
                 בגדול, התקציב מאורגן לפי משרדי הממשלה השונים. לכל משרד יש תקציב משלו, המתחלק בין היחידות השונות בתוך המשרד וכן הלאה. 
                 <br/>
                 זאת הסיבה שאם רוצים לדעת כמה כסף ״הולך לפריפריה״ או ״להתנחלויות״ או ״לערבים״ או ״לחרדים״
                 <small>
                 (ואנחנו מקבלים הרבה שאלות כאלו&#8230;)
                 </small>
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

            <category-visualization *ngFor="let category of econCategories"
                [category]="category"></category-visualization>          

            <hr/>
            <hr/>
            <hr/>
            <hr/>
            
            <h3>to be continued...</h3>
                        
            <!-- <map-visualization></map-visualization> -->
          </div>
        </div>
      </budgetkey-container>
  `,
})
export class AppComponent {

  private funcCategories: any[];
  private econCategories: any[];
  private incomeCategories: any[];
  private totalAmount: number = 0;
  private educationCharts: MushonKeyChart[];
  private deficitChart: MushonKeyChart;
  private year: number;

  constructor(private mainPage: BudgetKeyMainPageService,
              private scrolly: ScrollyService) {
    this.mainPage.getBubblesData().then((bubbles) => {
      this.year = bubbles.year;
      this.funcCategories = bubbles.func;
      this.econCategories = bubbles.econ;
      this.incomeCategories = bubbles.income;
      this.totalAmount = 0;
      this.funcCategories.forEach((category: any) => {
        this.totalAmount += category.amount;
      });
      this.deficitChart = AppComponent.makeDeficitChart(bubbles.deficitChart);
      this.educationCharts = _.map(bubbles.educationCharts, (c) => AppComponent.makeEducationChart(c));
    });
  }

  static makeFlow(amount: number, title: string) {
    let billions = amount/1000000000;
    let digits = billions < 5 ? 1 : 0;
    let amountStr =  billions.toFixed(digits) + ' מיל׳';
    title = title + ' ' + amountStr;
    return new MushonKeyFlow(amount, title, null);
  }

  static makeDeficitChart(data: any) {

    let children: Array<any> = _.sortBy(data.children, (d: any) => -d.net_allocated)
    let rest = data.budget - _.sum(
        _.map(_.slice(children, 0, 4),
              (d: any) => d.net_allocated)
    );
    let chart = new MushonKeyChart([
        new MushonKeyFlowGroup(
          true, [
            AppComponent.makeFlow(children[0].net_allocated, children[0].title),
          ], 'debt', -100, 0.7
        ),
        new MushonKeyFlowGroup(
          true, [
            AppComponent.makeFlow(children[1].net_allocated, children[1].title),
            AppComponent.makeFlow(children[2].net_allocated, children[2].title),
            AppComponent.makeFlow(children[3].net_allocated, children[3].title),
            AppComponent.makeFlow(rest, 'משרדי ממשלה אחרים')
          ], 'expenses', 20
        ),
        new MushonKeyFlowGroup(
          false, [
            AppComponent.makeFlow(data.income, 'הכנסות המדינה')
          ], 'income', -100
        ),
        new MushonKeyFlowGroup(
          false, [
            AppComponent.makeFlow(data.budget - data.income, 'הגירעון')
          ], 'deficit', 100, 0.7
        )
      ],
      'תקציב המדינה',
      200, 80, true, {top: 20, left: 20, right: 20, bottom: 20}
    );
    return chart;
  }

  static makeEducationChart(data: any) {
    let children: Array<any> = _.sortBy(data.children, (d: any) => -d.net_allocated)
    let rest = data.net_allocated - _.sum(
        _.map(_.slice(children, 0, 4),
          (d: any) => d.net_allocated)
      );
    let chart = new MushonKeyChart([
        new MushonKeyFlowGroup(
          true, [
            AppComponent.makeFlow(children[0].net_allocated, children[0].title),
            AppComponent.makeFlow(children[1].net_allocated, children[1].title),
            AppComponent.makeFlow(children[2].net_allocated, children[2].title),
            AppComponent.makeFlow(children[3].net_allocated, children[3].title),
            AppComponent.makeFlow(rest, 'אחרים...')
          ], 'expenses', 20
        ),
        new MushonKeyFlowGroup(
          false, [
            AppComponent.makeFlow(data.net_allocated, data.hierarchy[data.hierarchy.length-1][1])
          ], 'income', -100
        ),
      ],
      data.title,
      200, 80, true, {top: 20, left: 20, right: 20, bottom: 20}
    );
    return chart;
  }


  ngAfterViewInit() {
    this.scrolly.init();
  }
}
