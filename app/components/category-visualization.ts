import {
  Component, Input, OnInit, AfterViewInit,
  ViewEncapsulation, ViewChild, ElementRef
} from '@angular/core';
import * as _ from 'lodash';
import * as d3 from 'd3';
import { CATEGORIES_THEMES } from '../constants';
import { UtilsService } from '../services';

@Component({
  selector: 'category-info-popup',
  template: `
    <div class="category-info-popup text-right step" [ngStyle]="{left: bubble.left + 'px', bottom: bubble.top + 'px'}" data-id="category-visualisation">
      <h3>{{ bubble.name }}</h3>
      <div class="brief">
        <span>{{ formatAmount(bubble.value) }} ₪</span>
        <span>( {{ formatPercents(bubble.percent) }} )</span>
      </div>
      <div class="contents" *ngIf="currentTab == 0">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
        sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </div>
      <div class="contents" *ngIf="currentTab == 1">
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
        nisi ut aliquip ex ea commodo consequat.
      </div>
      <div class="contents" *ngIf="currentTab == 2">
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum 
        dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non 
        proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </div>
      <div class="pagination">
        <button type="button" [ngClass]="{active: currentTab == 0}" (click)="currentTab = 0"></button>
        <button type="button" [ngClass]="{active: currentTab == 1}" (click)="currentTab = 1"></button>
        <button type="button" [ngClass]="{active: currentTab == 2}" (click)="currentTab = 2"></button>
      </div>
      <div class="pointer"></div>
    </div>
  `
})
export class CategoryVisualizationInfoPopupComponent implements OnInit {
  @Input() bubble: any;

  currentTab: any = 0;

  private timer: any = 0;

  formatPercents(value: number): string {
    return this.utils.formatNumber(value, 1) + '%';
  }

  formatAmount(value: number): string {
    return this.utils.formatNumber(value, 2);
  }

  constructor(private utils: UtilsService) {}

  ngOnInit() {
    this.timer = setInterval(() => {
      this.currentTab = (this.currentTab + 1) % 3;
    }, 3000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }
}

@Component({
  selector: 'category-visualization',
  template: `
    <div #wrapper class="category-visualization" [ngClass]="theme">   
      <svg #container width="300" height="300"></svg>
      <div class="text-center">
        <span class="legend">
          <span class="value">{{ formatPercents(category.percent) }}</span>
          <span class="label">{{ category.name }}</span>
        </span>
      </div>
      <category-info-popup *ngIf="currentBubble" 
        [bubble]="currentBubble"></category-info-popup>
    </div>
  `,
  encapsulation: ViewEncapsulation.None
})
export class CategoryVisualizationComponent implements OnInit, AfterViewInit {
  @Input() category: any;
  @Input() kind: any;

  @ViewChild('wrapper') rootElement: ElementRef;
  @ViewChild('container') svg: ElementRef;

  theme: string = '';
  currentBubble: any;

  formatPercents(value: number): string {
    return this.utils.formatNumber(value, 1) + '%';
  }

  constructor(private utils: UtilsService) {}

  private createContainer(svg: any, diameter_w: number, diameter_h: number) {
    return svg.append('g')
      .attr('transform', 'translate(' + diameter_w / 2 + ',' + diameter_h / 2 + ')');
  }

  private renderCircles(container: any, nodes: any[]) {
    return container
      .attr('class', 'bubbles')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d: any) => d.r);
  }

  private renderLegendLines(container: any, nodes: any[]) {
    container
      .attr('class', 'legend-lines')
      .style('opacity', 0)
      .selectAll('path')
      .data(nodes)
      .enter()
      .append('path')
      .attr('d', (d: any) => {
        let result: any[] = [];
        _.each((<any>d.data).legendPointer, (p: any, index: number) => {
          result.push(index === 0 ? 'M' : 'L', p.x, p.y);
        });
        return result.join(' ');
      });

    container
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 2.25)
      .attr('cx', (d: any) => (<any>_.last((<any>d.data).legendPointer)).x)
      .attr('cy', (d: any) => (<any>_.last((<any>d.data).legendPointer)).y);

    return container;
  }

  private renderLegendLabels(container: any, root: any, nodes: any[], margin: number, padding: number) {
    container
      .attr('class', 'legend-labels')
      .style('opacity', 0)
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('g')
      .call(createLegendLabels, margin / 2, (value: number) => this.formatPercents(value))
      .attr('transform', function(d: any) {
        let p: any = _.last((<any>d.data).legendPointer);
        let bounds = (<any>this).getBoundingClientRect();

        let x = p.x;
        let y = (p.y - bounds.height / 2);
        if ((<any>d.data).alignment > 0) {
          x = x + bounds.width + padding / 3;
        } else {
          x = x - padding / 3;
        }
        return 'translate(' + x + ',' + y + ')';
      });

    function createLegendLabels(containers: any, maxWidth: number, formatPercents: any) {
      containers.each(function() {
        let containerForLabel = d3.select(this);
        let datum: any = containerForLabel.datum();

        let fragments: string[] = [
          formatPercents(datum.value / root.value * 100)
        ];

        let tempText = containerForLabel.append('text');
        let tempTextNode: any = tempText.node();
        let words = (<any>datum.data).name.split(/\s+/);
        let current: string[] = [];
        while (words.length > 0) {
          let word = words.shift();
          current.push(word);
          tempText.text(current.join(' '));
          if (tempTextNode.getComputedTextLength() > maxWidth) {
            if (current.length > 1) {
              word = current.pop();
              fragments.push(current.join(' '));
              current = [word];
            } else {
              fragments.push(current.join(' '));
              current = [];
            }
          }
        }
        if (current.length > 0) {
          fragments.push(current.join(' '));
        }
        containerForLabel.text(null); // clear container

        _.each(fragments, (text: string, index: number) => {
          containerForLabel.append('text')
            .attr('x', 0)
            .attr('y', (index + 1) * 1.1 + 'em')
            .text(text);
        });
      });
    }

    return container;
  }

  private prepareNodes(
    title: string, values: any, diameter: number, margin: number,
    padding: number
  ) {
    let pack = d3.pack()
      .size([diameter - margin, diameter - margin])
      .padding(padding);

    let data = _.map(<any>values, (value: any, key) => ({name: key, size: value.amount, href: value.href}));

    let root: any = d3.hierarchy({name: title, children: data})
      .sum((d: any) => d.size)
      .sort((a: any, b: any) => b.value - a.value);

    let nodes = pack(root).children;
    let temp = {x: root.x, y: root.y};

    function calculatePointAtRadius(r: number, p: any) {
      if ((p.x === 0) && (p.y === 0)) {
        return {x: r, y: r};
      }
      const q = r / Math.sqrt(p.x * p.x + p.y * p.y);
      return {x: p.x * q, y: p.y * q};
    }

    _.each(nodes, node => {
      node.x = node.x - temp.x;
      node.y = node.y - temp.y;

      let s = Math.sign(node.x);
      if (s === 0) {
        s = Math.round(node.x) % 2 === 0 ? 1 : -1;
      }

      const point1 = calculatePointAtRadius(
        Math.sqrt(node.x * node.x + node.y * node.y) + node.r,
        node
      );
      const point2 = calculatePointAtRadius(root.r, node);
      const point3 = {
        x: s * Math.min(root.r + padding, Math.abs(point2.x) + padding * 2),
        y: point2.y
      };

      (<any>node.data).alignment = s;
      (<any>node.data).legendPointer = [point1, point2, point3];
    });

    return {root, nodes};
  }

  ngOnInit() {
    this.theme = CATEGORIES_THEMES[this.category.name] || '';
    this.theme += ' vis-kind-'+this.kind;
  }

  ngAfterViewInit() {
    let svg = d3.select(this.svg.nativeElement);
    let diameter_w = +svg.attr('width');
    let diameter_h = +svg.attr('height');
    let margin = 150;
    let padding = 10;

    const {root, nodes} = this.prepareNodes(
      this.category.name, this.category.values,
      diameter_w, margin, padding);
    this.createContainer(svg, diameter_w, diameter_h);
    const circles = this.renderCircles(this.createContainer(svg, diameter_w, diameter_h), nodes);
    const legendLines = this.renderLegendLines(this.createContainer(svg, diameter_w, diameter_h), nodes);
    const legendLabels = this.renderLegendLabels(
      this.createContainer(svg, diameter_w, diameter_h),
      root, nodes, margin, padding
    );

    d3.select(this.rootElement.nativeElement)
      .on('mouseover', () => update(true, true))
      .on('mouseout', () => update(false, false));

    const that = this;
    circles
      .on('mouseover', function (datum: any) {
        const selfBounds = this.getBoundingClientRect();
        const parentBounds = that.rootElement.nativeElement.getBoundingClientRect();

        that.currentBubble = {
          name: (<any>datum.data).name,
          left: Math.round((selfBounds.left + selfBounds.right) / 2 - parentBounds.left),
          top: Math.round(parentBounds.bottom - selfBounds.top + 10),
          value: datum.value,
          percent: datum.value / root.value * 100,
        };
      })
      .on('click', function (datum: any) {
        window.location.href = datum.data.href;
      })
      .on('mouseout', () => {
        this.currentBubble = null;
      });

    update(false, false);

    function update(zoomCircles: boolean, showLabels: boolean) {
      const scale = zoomCircles ? 1 : 0.7;
      const opacity = showLabels ? 1 : 0;

      circles
        .transition()
        .duration(500)
        .ease(d3.easeBackOut)
        .attr('transform', (d: any) => 'translate(' + d.x * scale + ',' + d.y * scale + ')');

      legendLines
        .transition()
        .duration(200)
        .ease(d3.easeQuad)
        .style('opacity', opacity);

      legendLabels
        .transition()
        .duration(200)
        .ease(d3.easeQuad)
        .style('opacity', opacity);
    }
  }
}
