import { Component, Input, ViewEncapsulation } from '@angular/core';
import { Category } from './budgetpanel.component';

declare let d3: any

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
    <div class="category">   
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
    var svg = d3.select('#category' + this.category.id.toString()),
    margin = 20,
    diameter = +svg.attr("width"),
    g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

    var color = d3.scaleLinear()
    .domain([-1, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl);

    var pack = d3.pack()
        .size([diameter - margin, diameter - margin])
        .padding(2);

    var childern: any = this.category.subCategoryNames.map((sub) => {
      return { "name": sub, "size": 8833 };
    })

    var root: any = {
    "name": "display",
    "children": childern
    };    

    root = d3.hierarchy(root)
      .sum(function(d: any) { return d.size; })
      .sort(function(a: any, b: any) { return b.value - a.value; });

    var focus = root,
      nodes = pack(root).descendants(),
      view;  
   
    var circle = g.selectAll("circle")
    .data(nodes)
    .enter().append("circle")
      .attr("class", function(d: any) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
      .style("fill", function(d: any) { return d.children ? color(d.depth) : null; });      

    var text = g.selectAll("text")
    .data(nodes)
    .enter().append("text")
      .attr("class", "label")
      .style("fill-opacity", function(d: any) { return d.parent === root ? 1 : 0; })
      .style("display", function(d: any) { return d.parent === root ? "inline" : "none"; })
      .text(function(d: any) { return d.data.name; });

    var node = g.selectAll("circle,text");    

    svg
      .style("background", color(-1));  

    zoomTo([root.x, root.y, root.r * 2 + margin]);   
      
    function zoomTo(v: any) {
        var k = diameter / v[2]; view = v;
        node.attr("transform", function(d: any) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
        circle.attr("r", function(d: any) { return d.r * k; });
    }

  }
}