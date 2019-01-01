import { Component, Inject } from '@angular/core';
import { BUBBLES } from './constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  public funcCategories: any[];
  public econCategories: any[];
  public incomeCategories: any[];
  public totalAmount = 0;
  public year: number;

  constructor(@Inject(BUBBLES) private bubbles: any) {
    this.year = this.bubbles.year;
    this.funcCategories = bubbles.func;
    this.econCategories = bubbles.econ;
    this.incomeCategories = bubbles.income;
    this.totalAmount = 0;
    this.funcCategories.forEach((category: any) => {
      this.totalAmount += category.amount;
    });
  }
}
