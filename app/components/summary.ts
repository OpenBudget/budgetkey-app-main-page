import { Component, Input, Inject, ViewChild, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import * as _ from 'lodash';
import * as d3 from 'd3';
import { UtilsService } from '../services';

@Component({
  selector: 'budgetkey-main-page-summary',
  template: `
    <div class="budgetkey-main-summary-container step active collapsed" data-id="summary-description">
      <!--[ngClass]="{active: true || isActive, collapsed: true || isCollapsed}">-->
      <div class="description">
        <div class="speech-bubble question">הי, מה זה האתר הזה?</div>
        <div class="speech-bubble answer">
          אספנו והנגשנו ב״מפתח התקציב״ את כל המידע על תקציב המדינה ועל הוצאות הממשלה &ndash;<br/>
          כדי שנוכל לדעת מה עושים עם הכסף שלנו&hellip;
        </div>
      </div>
      <div class="row">
        <div class="col-xs-2">
        </div>
        <div class="col-xs-8">
          <div #container class="amount">
            <div class="title">
              <div>תקציב המדינה המאושר לשנת</div>
              <div>{{year}}</div>
              <div>הוא</div>
            </div>
            <div class="container">
              <div class="value">
                <span>{{ formatValue(amount) }}</span>
                <span>{{ valueSuffix(amount) }} ₪</span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xs-2">
        </div>
      </div>
    </div>
    <div class="transition-layer" #transitionLayer></div>
  `
})
export class SummaryComponent  {
  @Input() amount: number = 0;
  @Input() year: number = 0;
  @ViewChild('container') container: ElementRef;
  @ViewChild('transitionLayer') transitionLayer: ElementRef;

  private _isCollapsed = false;

  isActive: boolean = false;
  private transitionSource: any;
  private transitionTargets: Array<any>;

  get isCollapsed(): boolean {
    return this._isCollapsed;
  }

  set isCollapsed(value: boolean) {
    this._isCollapsed = value;
  }

  constructor(@Inject(DOCUMENT) private document: Document,
              private utils: UtilsService) {
  }

  ngAfterViewInit() {
    setTimeout(() => {
      let scroll = window.pageYOffset || document.documentElement.scrollTop;
      this.transitionSource = {
        node: d3.select(this.container.nativeElement),
        background: '#FF5A5F',
        bounds: (() => {
          const bounds = this.container.nativeElement.getBoundingClientRect();
          const size = 350;
          return {
            left: (bounds.left + bounds.right) / 2 - size / 2,
            top: bounds.bottom - size + scroll,
            right: (bounds.left + bounds.right) / 2 + size / 2,
            bottom: bounds.bottom,
            width: size,
            height: size,
          };
        })(),
      };

      let transitionTargets = this.document.querySelectorAll('.vis-kind-func');
      this.transitionTargets = _.map(transitionTargets, (element: any) => {
        const bounds = element.querySelector('svg').getBoundingClientRect();
        const x = (bounds.left + bounds.right) / 2;
        const y = (bounds.top + bounds.bottom) / 2 + scroll;
        const r = 50;
        return {
          node: d3.select(element),
          bounds: {
            left: x - r,
            top: y - r,
            right: x + r,
            bottom: y + r,
            width: r * 2,
            height: r * 2,
          },
        };
      });

    }, 100);
  }

  formatValue(value: number): string {
    return this.utils.bareFormatValue(value, 0);
  }

  valueSuffix(value: number): string {
    return this.utils.getValueSuffix(value);
  }

}
