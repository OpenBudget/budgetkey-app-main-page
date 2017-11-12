import { Component, Input, Inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
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

  isActive: boolean = false;
  isCollapsed: boolean = false;

  constructor(@Inject(DOCUMENT) private document: Document, private utils: UtilsService) { }

  formatValue(value: number): string {
    return this.utils.bareFormatValue(value, 0);
  }

  valueSuffix(value: number): string {
    return this.utils.getValueSuffix(value);
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    let clientHeight = this.document.documentElement.clientHeight;
    let bounds = this.container.nativeElement.getBoundingClientRect();
    this.isActive = bounds.top < clientHeight / 2;
    this.isCollapsed = (bounds.top + bounds.bottom) / 2 <= 50;
  }
}
