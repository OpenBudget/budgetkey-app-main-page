import { Component, Input, Inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import * as _ from 'lodash';
import * as d3 from 'd3';
import { UtilsService } from '../services';

@Component({
  selector: 'budgetkey-main-page-summary',
  template: `
    <div class="budgetkey-main-summary-container" 
      [ngClass]="{active: isActive, collapsed: isCollapsed}">
      <div class="description">
        <span>
        אספנו את כל הנתונים הרשמיים ממשרד האוצר,
        וסידרנו אותם בצורה ברורה שתאפשר לכם להבין מאיפה
        מגיע הכסף שלנו ולאן הוא הולך…
        </span>
      </div>
      <div class="row">
        <div class="col-xs-2">
          <div class="change-year">
            <div class="next-year">
              <div *ngIf="!isCollapsed">
                <div>תקציב המדינה<br>המאושר לשנת</div>
                <div class="year">2018</div>
              </div>
              <div *ngIf="isCollapsed">תקציב המדינה<br>לשנת 2018</div>
            </div>  
          </div>
        </div>
        <div class="col-xs-8">
          <div #container class="amount">
            <div class="title">
              <div>תקציב המדינה המאושר</div>
              <div>2017</div>
            </div>
            <div class="container">
              <div class="scroll-down">
                <div>גללו ותהנו</div>
                <div>
                  <svg width="30" viewBox="0 0 18 28">
                    <path d="M16.797 13.5c0 0.125-0.063 0.266-0.156 0.359l-7.281 
                      7.281c-0.094 0.094-0.234 0.156-0.359 
                      0.156s-0.266-0.063-0.359-0.156l-7.281-7.281c-0.094-0.094-0.156-0.234-0.156-0.359s0.063-0.266 
                      0.156-0.359l0.781-0.781c0.094-0.094 0.219-0.156 0.359-0.156 
                      0.125 0 0.266 0.063 0.359 0.156l6.141 6.141 6.141-6.141c0.094-0.094
                      0.234-0.156 0.359-0.156s0.266 0.063 0.359 0.156l0.781 0.781c0.094 
                      0.094 0.156 0.234 0.156 0.359zM16.797 7.5c0 0.125-0.063 0.266-0.156 
                      0.359l-7.281 7.281c-0.094 0.094-0.234 0.156-0.359 
                      0.156s-0.266-0.063-0.359-0.156l-7.281-7.281c-0.094-0.094-0.156-0.234-0.156-0.359s0.063
                      -0.266 0.156-0.359l0.781-0.781c0.094-0.094 0.219-0.156 0.359-0.156 
                      0.125 0 0.266 0.063 0.359 0.156l6.141 6.141 6.141-6.141c0.094-0.094 
                      0.234-0.156 0.359-0.156s0.266 0.063 0.359 0.156l0.781 0.781c0.094 0.094 
                      0.156 0.234 0.156 0.359z"></path>
                  </svg>
                </div>  
              </div>
              <div class="value">
                <span>{{ formatValue(amount) }}</span>
                <span>{{ valueSuffix(amount) }}<br>₪</span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xs-2">
          <div class="change-year">
            <div class="prev-year">
              <div *ngIf="!isCollapsed">
                <div>תקציב המדינה<br>המעודכן לשנת</div>
                <div class="year">2016</div>
              </div>
              <div *ngIf="isCollapsed">תקציב המדינה<br>לשנת 2016</div>
            </div>  
          </div>
        </div>
      </div>
    </div>
  `
})
export class SummaryComponent {
  @Input() amount: number = 0;
  @ViewChild('container') container: ElementRef;

  private _isCollapsed = false;

  isActive: boolean = false;
  get isCollapsed(): boolean {
    return this._isCollapsed;
  }
  set isCollapsed(value: boolean) {
    if (this._isCollapsed !== value) {
      this._isCollapsed = value;
      this._isCollapsed ? this.animateIn() : this.animateOut();
    }
  }

  constructor(@Inject(DOCUMENT) private document: Document, private utils: UtilsService) { }

  formatValue(value: number): string {
    return this.utils.bareFormatValue(value, 0);
  }

  valueSuffix(value: number): string {
    return this.utils.getValueSuffix(value);
  }

  animateIn() {
    const source = {
      node: d3.select(this.container.nativeElement),
      background: '#FF5A5F',
      bounds: (() => {
        const bounds = this.container.nativeElement.getBoundingClientRect();
        const size = 350;
        return {
          left: (bounds.left + bounds.right) / 2 - size / 2,
          top: bounds.bottom - size,
          right: (bounds.left + bounds.right) / 2 + size / 2,
          bottom: bounds.bottom,
          width: size,
          height: size,
        };
      })(),
    };

    let targets: any = this.document.querySelectorAll('.category-visualization');
    targets = _.map(targets, (element: any) => {
      const bounds = element.querySelector('svg').getBoundingClientRect();
      const x = (bounds.left + bounds.right) / 2;
      const y = (bounds.top + bounds.bottom) / 2;
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

    const layer = d3.select(document.body).append('div');
    layer.selectAll('div')
      .data(targets)
      .enter()
      .append('div')
      .style('background', source.background)
      .style('border-radius', '50%')
      .style('position', 'fixed')
      .style('opacity', 1)
      .style('left', source.bounds.left + 'px')
      .style('top', source.bounds.top + 'px')
      .style('width', source.bounds.width + 'px')
      .style('height', source.bounds.height + 'px')
      .transition()
      .duration(200)
      .ease(d3.easePolyOut)
      .style('opacity', 0)
      .style('left', (d: any) => d.bounds.left + 'px')
      .style('top', (d: any) => d.bounds.top + 'px')
      .style('width', (d: any) => d.bounds.width + 'px')
      .style('height', (d: any) => d.bounds.height + 'px')
      .on('end', _.debounce(() => {
        layer.remove();
      }, 1));

    // Trigger animation after 100ms of placeholder's animation start
    setTimeout(() => {
      _.each(targets, (item: any) => {
        item.node.classed('invisible', false);
      });
    }, 100);
  }

  animateOut() {
    const source = {
      node: d3.select(this.container.nativeElement),
      background: '#FF5A5F',
      bounds: (() => {
        const bounds = this.container.nativeElement.getBoundingClientRect();
        const size = 250;
        return {
          left: (bounds.left + bounds.right) / 2 - size / 2,
          top: bounds.bottom - size,
          right: (bounds.left + bounds.right) / 2 + size / 2,
          bottom: bounds.bottom,
          width: size,
          height: size,
        };
      })()
    };

    let targets: any = this.document.querySelectorAll('.category-visualization');
    targets = _.map(targets, (element: any) => {
      const bounds = element.querySelector('svg').getBoundingClientRect();
      const x = (bounds.left + bounds.right) / 2;
      const y = (bounds.top + bounds.bottom) / 2;
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

    // Immediately initiate animations on targets
    _.each(targets, (item: any) => {
      item.node.classed('invisible', true);
    });

    const layer = d3.select(document.body).append('div');
    layer.selectAll('div')
      .data(targets)
      .enter()
      .append('div')
      .style('background', source.background)
      .style('border-radius', '50%')
      .style('position', 'fixed')
      .style('opacity', 0)
      .style('left', (d: any) => d.bounds.left + 'px')
      .style('top', (d: any) => d.bounds.top + 'px')
      .style('width', (d: any) => d.bounds.width + 'px')
      .style('height', (d: any) => d.bounds.height + 'px')
      .transition()
      .duration(200)
      .ease(d3.easePolyOut)
      .style('opacity', 0.5)
      .style('left', source.bounds.left + 'px')
      .style('top', source.bounds.top + 'px')
      .style('width', source.bounds.width + 'px')
      .style('height', source.bounds.height + 'px')
      .on('end', _.debounce(() => {
        layer.remove();
      }, 1));
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    let clientHeight = this.document.documentElement.clientHeight;
    let bounds = this.container.nativeElement.getBoundingClientRect();
    this.isActive = bounds.top < clientHeight / 2;
    this.isCollapsed = (bounds.top + bounds.bottom) / 2 <= 50;
  }
}
