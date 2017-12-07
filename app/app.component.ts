import {Component, ViewChild} from '@angular/core';
import { BudgetKeyMainPageService } from './services';
import {ScrollyService} from "./services/scrolly";

@Component({
  selector: 'my-app',
  template: `
      <budgetkey-container>
        <div class="container-fluid scroll" style="position: relative">
            <div class="non-sticky">
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
                      [category]="category" data-kind="func"></category-visualization>
              </div>
            </div>
            <div class="text-center">
                <hero></hero>           
            </div>
            <div class="after">
          
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
    });
  }

  ngAfterViewInit() {
    this.scrolly.init();
  }
}
