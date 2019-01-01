import { Component, Input} from '@angular/core';
import { UtilsService } from '../utils.service';


@Component({
  selector: 'category-visualization-info-popup',
  templateUrl: './category-visualization-info-popup.component.html',
  styleUrls: ['./category-visualization-info-popup.component.less']
})
export class CategoryVisualizationInfoPopupComponent {

  @Input() bubble: any;

  currentTab: any = 0;

  constructor(private utils: UtilsService) {}

  formatPercents(value: number): string {
    return this.utils.formatNumber(value, 1) + '%';
  }

  formatAmount(value: number): string {
    return this.utils.formatNumber(value, 2);
  }
}

