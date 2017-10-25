import { Injectable } from '@angular/core';
import * as Promise from 'bluebird';

import { BUBBLES } from './data';

@Injectable()
export class BudgetKeyMainPageService {

  public getBubblesData(): Promise<any> {
    return Promise.resolve(BUBBLES);
  }

}
