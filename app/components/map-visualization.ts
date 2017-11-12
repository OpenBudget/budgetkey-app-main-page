import { Component, Inject, ViewChild, ElementRef, OnInit } from '@angular/core';
import { MAPBOXGL_TOKEN } from '../constants';

@Component({
  selector: 'map-visualization',
  template: `
    <div #map class="map-container"></div>
  `
})
export class MapVisualizationComponent implements OnInit {

  @ViewChild('map') map: ElementRef;

  constructor(@Inject(MAPBOXGL_TOKEN) private mapboxgl: any) {
  }

  ngOnInit() {
    if (this.mapboxgl) {
      let map = new this.mapboxgl.Map({
        container: this.map.nativeElement, // container
        style: 'mapbox://styles/mushon/cj80kn9qe7tnp2rproys508t0', // stylesheet location
        center: [72.680, 23.345], // starting position [lng, lat]
        zoom: 4 // starting zoom
      });

      map.on('load', function () {
        map.setLayoutProperty('entire-budget-lines', 'visibility', 'visible');
        map.setFilter('entire-budget-lines', ['!=', 'type', 'branch']);
      });
    }
  }

}
