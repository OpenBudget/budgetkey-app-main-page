import { Component, Input, ViewEncapsulation } from '@angular/core';
import { Category } from './budgetpanel.component';
import * as d3 from 'd3';

@Component({
  selector: 'category',
  styles: [`
    .node {
        cursor: pointer;
    }

    .node:hover {
        stroke: #000;
        stroke-width: 1.5px;
    }

    .node--leaf {
        fill: white;
    }

    .label {
        font: 11px "Helvetica Neue", Helvetica, Arial, sans-serif;
        text-anchor: middle;
        text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, -1px 0 0 #fff, 0 -1px 0 #fff;        
    }

    .label,
        .node--root,
        .node--leaf {
        pointer-events: none;
    }
  `],
  template: `
    <div class='category'>   
      <p>{{ category.categoryName }}</p>
      <svg id="category{{category.id.toString()}}" width="300" height="300"></svg>
    </div>
  `,
  encapsulation: ViewEncapsulation.None
})
export class CategoryComponent {
  @Input()
  category: Category;
  ngAfterViewInit() {
    let svg = d3.select('#category' + this.category.id.toString()),
    margin = 20,
    diameter = +svg.attr('width'),
    g = svg.append('g').attr('transform', 'translate(' + diameter / 2 + ',' + diameter / 2 + ')');

    let color = d3.scaleLinear()
    .domain([-1, 5])
    // <any> to shut tslint up
    .range([<any>'hsl(152,80%,80%)', <any>'hsl(228,30%,40%)'])
    .interpolate(<any>d3.interpolateHcl);

    let pack = d3.pack()
        .size([diameter - margin, diameter - margin])
        .padding(5);

    let childern: any = this.category.subCategories.map((sub) => {
      return { 'name': sub[0], 'size': sub[1] };
    });

    let root: any = {
    'name': 'display',
    'children': childern
    };

    root = d3.hierarchy(root)
      .sum(function(d: any) { return d.size; })
      .sort(function(a: any, b: any) { return b.value - a.value; });

    let nodes = pack(root).descendants();
    let view;

    let circle = g.selectAll('circle')
    .data(nodes)
    .enter().append('circle')
      .attr('class', function(d: any) { return d.parent ? d.children ? 'node' : 'node node--leaf' : 'node node--root'; })
      .style('fill', function(d: any) { return d.children ? color(d.depth) : null; });

    g.selectAll('.text-name')
    .data(nodes)
    .enter().append('text')
      .attr('class', 'label text-name')
      .attr('dy', 0)
      .style('fill-opacity', function(d: any) { return d.parent === root ? 1 : 0; })
      .style('display', function(d: any) { return d.parent === root ? 'inline' : 'none'; })
      .text(function(d: any) { return d.data.name; });
    g.selectAll('.text-amount')
      .data(nodes)
      .enter().append('text')
      .attr('class', 'label text-amount')
      .attr('dy', '1em')
      .style('fill-opacity', function(d: any) { return d.parent === root ? 1 : 0; })
      .style('display', function(d: any) { return d.parent === root ? 'inline' : 'none'; })
      .text(function(d: any) { return Math.ceil(d.data.size / 10) / 100 + ' מיליארד ₪'; });

    let node = g.selectAll('circle,text');

    svg.style('background', color(-1));

    zoomTo([root.x, root.y, root.r * 2 + margin]);

    function zoomTo(v: any) {
      let k = diameter / v[2]; view = v;
      node.attr('transform', function(d: any) { return 'translate(' + (d.x - v[0]) * k + ',' + (d.y - v[1]) * k + ')'; });
      circle.attr('r', function(d: any) { return d.r * k; });
    }

  }
}
