import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  styles: [`
    budgetkey-container {
        background-color: #cfc;
        display: block;
    }
    
    .container-fluid {
        padding: 10px;
        max-width: 1024px;
    }
  `],
  template: `
      <budgetkey-container>
        <budget-panel></budget-panel>
      </budgetkey-container>
  `,
})
export class AppComponent  {
}
