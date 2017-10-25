import { Injectable } from '@angular/core';
import * as Promise from 'bluebird';

import { BUBBLES } from './data';

@Injectable()
export class BudgetKeyMainPage {

  public getBubblesData(): Promise<any> {
    return Promise.resolve(BUBBLES);
  }

}
