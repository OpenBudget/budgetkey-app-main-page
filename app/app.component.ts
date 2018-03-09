import {Component, ViewChild} from '@angular/core';
import { BudgetKeyMainPageService } from './services';

@Component({
  selector: 'my-app',
  template: ` 
      <budgetkey-container [showHeader]="true" [showSearchBar]="true">
        <div class="container-fluid scroll" style="position: relative">
            <div class="non-sticky">
              <budgetkey-main-page-summary [amount]="totalAmount" [year]="year"></budgetkey-main-page-summary>
              <div class="text-center">
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
                <div class="footer text-center graph-bg">
                    <div class="dialogLine speech-bubble question">אם יש לי עדיין שאלות, למי לפנות?</div>
                    <div class="dialogLine speech-bubble answer">
                        <a href="mailto:adam@obudget.org"
                           target="_blank">
                            אם זו שאלה כללית שקשורה לתקציב נשמח לעזור
                        </a>
                    </div>
                    <div class="dialogLine speech-bubble answer">
                        <a href="http://www.hasadna.org.il/about-us/"
                           target="_blank">
                            אם זו שאלה שקשורה לסדנא לידע ציבורי
                        </a>
                    </div>
                    <div class="dialogLine speech-bubble answer">
                        <a href="http://www.hasadna.org.il/%D7%A6%D7%95%D7%A8-%D7%A7%D7%A9%D7%A8/"
                           target="_blank">
                            אם את/ה עיתונאי/ת
                        </a>
                    </div>
                    <div class="dialogLine speech-bubble question">איך אפשר לעזור לכם?</div>
                    <div class="dialogLine speech-bubble answer">
                        <a href="http://www.hasadna.org.il/%D7%AA%D7%A8%D7%95%D7%9E%D7%94-2/"
                           target="_blank">
                            אפשר לתרום לנו...
                        </a>
                    </div>
                    <div class="dialogLine speech-bubble answer">
                        <a href="http://www.hasadna.org.il/%D7%94%D7%AA%D7%A0%D7%93%D7%91%D7%95%D7%AA/"
                           target="_blank">
                            או לבוא להתנדב
                        </a>
                    </div>
                    <div class="dialogLine speech-bubble answer">
                        <a href="https://github.com/OpenBudget/BudgetKey"
                           target="_blank">
                            או לשחק עם הקוד של האתר
                        </a>
                    </div>
                </div>
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

  constructor(private mainPage: BudgetKeyMainPageService) {
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
}
