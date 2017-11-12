import { Component } from '@angular/core';
import { BudgetKeyMainPageService } from './services';

@Component({
  selector: 'my-app',
  template: `
      <budgetkey-container>
        <div class="container-fluid">
          <budgetkey-main-page-header></budgetkey-main-page-header>
          <budgetkey-main-page-summary [amount]="totalAmount"></budgetkey-main-page-summary>
          <div class="text-center">
            <category-visualization *ngFor="let category of categories"
              [category]="category"></category-visualization>
          </div>
          <map-visualization></map-visualization>
        </div>  
      </budgetkey-container>
  `,
})
export class AppComponent {

  categories: any[];
  totalAmount: number = 0;

  constructor(private mainPage: BudgetKeyMainPageService) {
    this.mainPage.getBubblesData().then(bubbles => {
      this.categories = bubbles;
      this.totalAmount = 0;
      this.categories.forEach((category: any) => {
        this.totalAmount += category.amount;
      });
    });
  }

}
