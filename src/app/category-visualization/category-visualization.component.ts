import { Component, OnInit, Input, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { UtilsService } from '../utils.service';
import { CATEGORIES_THEMES } from '../constants';
import { __T } from '../app.component';

import * as _ from 'lodash';
import * as d3 from 'd3';

@Component({
  selector: 'category-visualization',
  templateUrl: './category-visualization.component.html',
  styleUrls: ['./category-visualization.component.less']
})
export class CategoryVisualizationComponent implements OnInit, AfterViewInit {
  @Input() category: any;
  @Input() kind: any;

  @ViewChild('wrapper') rootElement: ElementRef;
  @ViewChild('container') svg: ElementRef;

  __ = __T;

  theme = '';
  currentBubble: any;
  scale: number;

  formatPercents(value: number): string {
    return this.utils.formatNumber(value, 1) + '%';
  }

  formatAmount(value: number): string {
    return this.utils.formatNumber(value / 1000000000, 2) + __T('מיליארד') + ' ₪';
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
        const result: any[] = [];
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

  private renderLegendLabels(container: any, root: any, category: any,
                             nodes: any[], margin: number, padding: number) {
    container
      .attr('class', 'legend-labels')
      .style('opacity', 0)
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('g')
      .call(createLegendLabels, margin / 2, (value: number) => this.formatPercents(value))
      .attr('transform', function(d: any) {
        const p: any = _.last((<any>d.data).legendPointer);
        const bounds = (<any>this).getBoundingClientRect();

        let x = p.x;
        const y = (p.y - bounds.height / 2);
        if ((<any>d.data).alignment > 0) {
          x = x + bounds.width + padding / 3;
        } else {
          x = x - padding / 3;
        }
        return 'translate(' + x + ',' + y + ')';
      });

    function createLegendLabels(containers: any, maxWidth: number, formatPercents: any) {
      containers.each(function() {
        const containerForLabel = d3.select(this);
        const datum: any = containerForLabel.datum();

        const fragments: string[] = [
          formatPercents(datum.value / root.value * category.percent)
        ];

        const tempText = containerForLabel.append('text');
        const tempTextNode: any = tempText.node();
        const words = __T((<any>datum.data).name).split(/\s+/);
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
    const pack = d3.pack()
      .size([diameter - margin, diameter - margin])
      .padding(padding);

    const data = _.map(<any>values,
      (value: any, key) => ({
        name: key,
        size: value.amount,
        href: value.href,
        explanation: value.explanation,
        explanation_source: value.explanation_source
      }));

    const root: any = d3.hierarchy({name: title, children: data})
      .sum((d: any) => d.size)
      .sort((a: any, b: any) => b.value - a.value);

    const nodes = pack(root).children;
    const temp = {x: root.x, y: root.y};

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
    this.theme += ' vis-kind-' + this.kind;
    this.scale = this.category.scale;
  }

  ngAfterViewInit() {
    const svg = d3.select(this.svg.nativeElement);
    const diameter_w = +svg.attr('width');
    const diameter_h = +svg.attr('height');
    const margin = 150;
    const padding = 10;

    const {root, nodes} = this.prepareNodes(
      this.category.name, this.category.values,
      diameter_w, margin, padding);
    this.createContainer(svg, diameter_w, diameter_h);
    const circles = this.renderCircles(this.createContainer(svg, diameter_w, diameter_h), nodes);
    const legendLines = this.renderLegendLines(this.createContainer(svg, diameter_w, diameter_h), nodes);
    const legendLabels = this.renderLegendLabels(
      this.createContainer(svg, diameter_w, diameter_h),
      root, this.category, nodes, margin, padding
    );

    d3.select(this.rootElement.nativeElement)
      .on('mouseover', () => update(true, true, this.scale))
      .on('mouseout', () => update(false, false, this.scale));

    const that = this;
    circles
      .on('mouseover', function (datum: any) {
        const selfBounds = this.getBoundingClientRect();
        const parentBounds = that.rootElement.nativeElement.getBoundingClientRect();

        let explanation = 'אין מידע';
        if ((<any>datum.data).explanation) {
          explanation = (<any>datum.data).explanation +
            '<br/><small>מקור:' +
            ((<any>datum.data).explanation_source) +
            '</small>';
        }
        that.currentBubble = {
          name: (<any>datum.data).name,
          explanation: explanation,
          left: Math.round((selfBounds.left + selfBounds.right) / 2 - parentBounds.left),
          top: Math.round(parentBounds.bottom - selfBounds.top + 10),
          value: datum.value,
          percent: datum.value / root.value * that.category.percent,
        };
      })
      .on('click', function (datum: any) {
        window.location.href = datum.data.href;
      })
      .on('mouseout', () => {
        this.currentBubble = null;
      });

    update(false, false, this.scale);

    function update(zoomCircles: boolean, showLabels: boolean, circleScale: number) {
      const scale = zoomCircles ? 1 : 0.7;
      circleScale = zoomCircles ? 1 : circleScale;
      const opacity = showLabels ? 1 : 0;
      const delay = zoomCircles ? 0 : 100;

      circles
        .transition()
        .delay(delay)
        .duration(500)
        .ease(d3.easeBackOut)
        .attr('transform', (d: any) => 'scale(' + circleScale + ')' + ' translate(' + d.x * scale + ',' + d.y * scale + ')');

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
