import { Component } from '@angular/core';
import { BudgetKeyMainPageService } from './services';
import {ScrollyService} from "./services/scrolly";

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
            <category-visualization *ngFor="let category of categories"
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
            <category-visualization *ngFor="let category of econ_categories"
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
            <category-visualization *ngFor="let category of income_categories"
              [category]="category"></category-visualization>
            <div class="description">
               <span>            
               האם ההכנסות זהות להוצאות? לא בדיוק...
               <br/>
               כל שנה הממשלה מוציאה קצת יותר כסף ממה שנכנס,  
               <br/>
               אבל אנחנו לא נכנסים למינוס - כי האוכלוסיה גדלה, המשק צומח וההכנסות של השנה אחרי מכסות את הפער.
               <br/>
               להפרש בין ההוצאות להכנסות קוראים ״גרעון״. 
               </span>
            </div>
            <h4 style="direction:ltr">to be continued...</h4>
          </div>
          <!--map-visualization></map-visualization-->
        </div>  
      </budgetkey-container>
  `,
})
export class AppComponent {

  categories: any[];
  econ_categories: any[];
  income_categories: any[];
  totalAmount: number = 0;

  constructor(private mainPage: BudgetKeyMainPageService,
              private scrolly: ScrollyService) {
    this.mainPage.getBubblesData().then((bubbles) => {
      this.categories = bubbles.func;
      this.econ_categories = bubbles.econ;
      this.income_categories = bubbles.income;
      this.totalAmount = 0;
      this.categories.forEach((category: any) => {
        this.totalAmount += category.amount;
      });
    });
  }

  ngAfterViewInit() {
    this.scrolly.init();
  }
}
