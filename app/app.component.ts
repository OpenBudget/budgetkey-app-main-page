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
          <budgetkey-main-page-summary [amount]="totalAmount"></budgetkey-main-page-summary>
          <div class="text-center">
            <div class="description">
               <span>
               התקציב משמש למגוון מטרות, לפי ראות עיניהן של הממשלה והכנסת.
               <br/>
                ניתן לראות שהנושאים הגדולים ביותר הם:
               <br/>
                 (1) השרותים החברתיים, (2) החזר החובות ו-(3) הביטחון.
               <br/>
               כל נושא כזה בנוי מאינספור ״תקנות תקציביות״ שונות...
               </span>
            </div>
            <category-visualization *ngFor="let category of funcCategories"
              [category]="category"></category-visualization>
            <div class="description">
               <span>            
               כל תקנה מגדירה סכום כסף שהמדינה החליטה להוציא עבור פעילות כלשהי - 
               <br/>
               ובאיזה דרך היא תוציא אותו.
               <br/>
               הדרכים העיקריות שבהן המדינה מוציאה כסף (פרט להחזרי החובות) הן
               <br/>
               (1) תמיכה ברשויות וארגונים, (2) משכורות לעובדים ו(3) קניית מוצרים ושירותים
               </span>
            </div>
            <category-visualization *ngFor="let category of econCategories"
              [category]="category"></category-visualization>
            <div class="description">
               <span>            
               מאיפה מגיע הכסף לתקציב המדינה?
               <br/>
               יש לא מעט מקורות, אבל אפשר לראות שהעיקריים הם
               <br/>
                (1) מס הכנסה (ובתוכו בעיקר מס חברות), (2) מע״מ ו (3) גיוסים בשוק ההון.
               </span>
            </div>
            <category-visualization *ngFor="let category of incomeCategories"
              [category]="category"></category-visualization>
            <div class="description">
               <span>            
               האם ההכנסות זהות להוצאות? לא בדיוק...
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
          </div>
          <!--map-visualization></map-visualization-->
        </div>  
      </budgetkey-container>
  `,
})
export class AppComponent {

  funcCategories: any[];
  econCategories: any[];
  incomeCategories: any[];
  totalAmount: number = 0;
  private deficitChart: MushonKeyChart;

  constructor(private mainPage: BudgetKeyMainPageService,
              private scrolly: ScrollyService) {
    this.mainPage.getBubblesData().then((bubbles) => {
      this.funcCategories = bubbles.func;
      this.econCategories = bubbles.econ;
      this.incomeCategories = bubbles.income;
      this.totalAmount = 0;
      this.funcCategories.forEach((category: any) => {
        this.totalAmount += category.amount;
      });
      this.deficitChart = AppComponent.makeDeficitChart(bubbles.deficitChart);
    });
  }

  static makeFlow(amount: number, title: string) {
    let amountStr =  Math.round(amount/1000000000)+' מיל׳';
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

  ngAfterViewInit() {
    this.scrolly.init();
  }
}
