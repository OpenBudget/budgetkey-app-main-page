import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { UtilsService } from '../utils.service';
import { __T } from '../app.component';

@Component({
  selector: 'main-page-summary',
  templateUrl: './main-page-summary.component.html',
  styleUrls: ['./main-page-summary.component.less']
})
export class MainPageSummaryComponent {
  @Input() amount = 0;
  @Input() year = 0;

  private _isCollapsed = false;
  __ = __T;

  isActive = false;

  get isCollapsed(): boolean {
    return this._isCollapsed;
  }

  set isCollapsed(value: boolean) {
    this._isCollapsed = value;
  }

  constructor(private utils: UtilsService) {
  }

  formatValue(value: number): string {
    return this.utils.bareFormatValue(value, 0);
  }

  valueSuffix(value: number): string {
    return this.utils.getValueSuffix(value);
  }

}
