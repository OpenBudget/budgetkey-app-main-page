import { Component, Input, Inject, HostListener, ViewChild, ElementRef } from '@angular/core';
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
        <!--<div class="speech-bubble answer">מה? מפתח התקציב?</div>-->
        <div class="speech-bubble answer">אספנו והנגשנו ב״מפתח התקציב״ את כל המידע על תקציב המדינה ועל הוצאות הממשלה &ndash;<br/> כדי שנוכל לדעת מה עושים עם הכסף שלנו&hellip;</div>
      </div>
      <div class="row">
        <div class="col-xs-2">
          <!--<div class="change-year">-->
            <!--<div class="next-year">-->
              <!--<div *ngIf="!isCollapsed">-->
                <!--<div>תקציב המדינה<br>המאושר לשנת</div>-->
                <!--<div class="year">2018</div>-->
              <!--</div>-->
              <!--<div *ngIf="isCollapsed">תקציב המדינה<br>לשנת 2018</div>-->
            <!--</div>-->
          <!--</div>-->
        </div>
        <div class="col-xs-8">
          <div #container class="amount">
            <div class="title">
              <div>תקציב המדינה המאושר לשנת</div>
              <div>{{year}}</div>
              <div>הוא</div>
            </div>
            <div class="container">
              <!--<div class="scroll-down">-->
                <!--<div>גללו ותהנו</div>-->
                <!--<div>-->
                  <!--<svg width="30" viewBox="0 0 18 28">-->
                    <!--<path d="M16.797 13.5c0 0.125-0.063 0.266-0.156 0.359l-7.281-->
                      <!--7.281c-0.094 0.094-0.234 0.156-0.359-->
                      <!--0.156s-0.266-0.063-0.359-0.156l-7.281-7.281c-0.094-0.094-0.156-0.234-0.156-0.359s0.063-0.266-->
                      <!--0.156-0.359l0.781-0.781c0.094-0.094 0.219-0.156 0.359-0.156-->
                      <!--0.125 0 0.266 0.063 0.359 0.156l6.141 6.141 6.141-6.141c0.094-0.094-->
                      <!--0.234-0.156 0.359-0.156s0.266 0.063 0.359 0.156l0.781 0.781c0.094-->
                      <!--0.094 0.156 0.234 0.156 0.359zM16.797 7.5c0 0.125-0.063 0.266-0.156-->
                      <!--0.359l-7.281 7.281c-0.094 0.094-0.234 0.156-0.359-->
                      <!--0.156s-0.266-0.063-0.359-0.156l-7.281-7.281c-0.094-0.094-0.156-0.234-0.156-0.359s0.063-->
                      <!-- -0.266 0.156-0.359l0.781-0.781c0.094-0.094 0.219-0.156 0.359-0.156-->
                      <!--0.125 0 0.266 0.063 0.359 0.156l6.141 6.141 6.141-6.141c0.094-0.094-->
                      <!--0.234-0.156 0.359-0.156s0.266 0.063 0.359 0.156l0.781 0.781c0.094 0.094-->
                      <!--0.156 0.234 0.156 0.359z"></path>-->
                  <!--</svg>-->
                <!--</div>-->
              <!--</div>-->
              <div class="value">
                <span>{{ formatValue(amount) }}</span>
                <span>{{ valueSuffix(amount) }}<br>₪</span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xs-2">
          <!--<div class="change-year">-->
            <!--<div class="prev-year">-->
              <!--<div *ngIf="!isCollapsed">-->
                <!--<div>תקציב המדינה<br>המעודכן לשנת</div>-->
                <!--<div class="year">2016</div>-->
              <!--</div>-->
              <!--<div *ngIf="isCollapsed">תקציב המדינה<br>לשנת 2016</div>-->
            <!--</div>-->
          <!--</div>-->
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

  ngAfterViewInit(){
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

      // const layer = d3.select(this.transitionLayer.nativeElement);
      // layer.selectAll('div')
      //   .data(this.transitionTargets)
      //   .enter()
      //   .append('div')
      //   .style('background', this.transitionSource.background)
      //   .style('border-radius', '50%')
      //   .style('position', 'absolute')
      //   .style('opacity', 1)
      //   .style('left', this.transitionSource.bounds.left + 'px')
      //   .style('top', this.transitionSource.bounds.top + 'px')
      //   .style('width', this.transitionSource.bounds.width + 'px')
      //   .style('height', this.transitionSource.bounds.height + 'px')
      //   .style('opacity', 0);
    }, 100);
  }

  formatValue(value: number): string {
    return this.utils.bareFormatValue(value, 0);
  }

  valueSuffix(value: number): string {
    return this.utils.getValueSuffix(value);
  }

  animate(t: number) {
    function _(t: number, i: number, pow?: number) {
      if (!pow) pow=1;
      let ret = t - (6-i)*0.1;
      if (ret<0) ret = 0;
      if (ret>1) ret = 1;
      ret = ret ** pow;
      return ret;
    }
    const layer = d3.select(this.transitionLayer.nativeElement);
    layer.selectAll('div')
      // .data(this.transitionTargets)
      .style('left', (d: any, i: number) => ((1-_(t,i))*this.transitionSource.bounds.left + _(t,i)*d.bounds.left) + 'px')
      .style('top', (d: any, i: number) => ((1-_(t,i))*this.transitionSource.bounds.top + _(t,i)*d.bounds.top) + 'px')
      .style('width', (d: any, i: number) => ((1-_(t,i,.20))*this.transitionSource.bounds.width+ _(t,i,.20)*d.bounds.width) + 'px')
      .style('height', (d: any, i: number) => ((1-_(t,i,.20))*this.transitionSource.bounds.height + _(t,i,.20)*d.bounds.height) + 'px')
      .style('opacity', (d: any, i: number) => _(t,i) > 0 ? (_(t,i) < 0.99 ? 0.7*(1-_(t,i))**0.2 : 0) : 0)
  }
}
