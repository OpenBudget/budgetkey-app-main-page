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
                <!--<div class="description">-->
        <!--<div class="speech-bubble question">הי, מה זה האתר הזה?</div>-->
        <!--<div class="speech-bubble answer">ב״מפתח התקציב״ אפשר למצוא את  </div>-->
        <!--<div class="speech-bubble answer">כל המידע על התקציב ועל הוצאות הממשלה</div>-->
        <!--<div class="speech-bubble answer">בצורה מסודרת וברורה</div>-->
                   <!--<span>-->
                   <!--התקציב משמש למגוון מטרות, לפי ראות עיניהן של הממשלה והכנסת.-->
                   <!--<br/>-->
                    <!--ניתן לראות שהנושאים הגדולים ביותר הם:-->
                   <!--<br/>-->
                     <!--(1) השרותים החברתיים, (2) החזר החובות ו-(3) הביטחון.-->
                   <!--<br/>-->
                   <!--כל נושא כזה מורכב מנושאי משנה. כך למשל, השרותים החברתיים כוללים את החינוך, הבריאות, הביטוח הלאומי ועוד-->
                   <!--<br/>-->
                   <!--כל תת-נושא בסופו של דבר מטופל על ידי משרד ממשלתי אחד (או יותר)-->
                   <!--<br/>         -->
                   <!--<small>-->
                   <!--עברו עם העכבר על הבועות בשביל ללמוד עוד-->
                   <!--</small>-->
                   <!--</span>-->
                <!--</div>-->
                <div class="category-visualizations">
                  <category-visualization *ngFor="let category of funcCategories"
                        [category]="category" data-kind="func">                      
                  </category-visualization>               
                </div>
                <br/>
                <div class="course">
                    <span>
                        אבל איך בעצם בנוי תקציב המדינה?
                    </span>
                    <div style="font-size: 50%">(כל מה שרציתם לדעת על התקציב ב-5 דקות!)</div>
                    <span class="scroll-down">
                      <svg width="30" viewBox="0 0 18 28">
                        <path d="M16.797 13.5c0 0.125-0.063 0.266-0.156 0.359l-7.281 7.281c-0.094 0.094-0.234 0.156-0.359 0.156s-0.266-0.063-0.359-0.156l-7.281-7.281c-0.094-0.094-0.156-0.234-0.156-0.359s0.063-0.266 0.156-0.359l0.781-0.781c0.094-0.094 0.219-0.156 0.359-0.156 0.125 0 0.266 0.063 0.359 0.156l6.141 6.141 6.141-6.141c0.094-0.0940.234-0.156 0.359-0.156s0.266 0.063 0.359 0.156l0.781 0.781c0.094 0.094 0.156 0.234 0.156 0.359zM16.797 7.5c0 0.125-0.063 0.266-0.156 0.359l-7.281 7.281c-0.094 0.094-0.234 0.156-0.359 0.156s-0.266-0.063-0.359-0.156l-7.281-7.281c-0.094-0.094-0.156-0.234-0.156-0.359s0.063-0.266 0.156-0.359l0.781-0.781c0.094-0.094 0.219-0.156 0.359-0.156 0.125 0 0.266 0.063 0.359 0.156l6.141 6.141 6.141-6.141c0.094-0.094 0.234-0.156 0.359-0.156s0.266 0.063 0.359 0.156l0.781 0.781c0.094 0.094 0.156 0.234 0.156 0.359z"></path>
                      </svg>                                        
                    </span>
                </div>
              </div>
            </div>
            <div class="text-center">
                <hero></hero>           
            </div>
            <div class="after">
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
