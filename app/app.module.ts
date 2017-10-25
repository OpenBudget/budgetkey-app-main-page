import './rxjs-extensions';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';

import { BudgetKeyCommonModule } from 'budgetkey-ng2-components';

import { AppComponent }  from './app.component';
import {
  PageHeader, Summary, MapVisualization,
  CategoryVisualizationComponent, CategoryVisualizationInfoPopup
} from './components';

import { BudgetKeyMainPage } from './services';

import { KeysPipe } from './pipes';

import { MAPBOXGL_TOKEN, MAPBOXGL_ACCESS_TOKEN } from './constants';

/* global mapboxgl */
declare const mapboxgl: any;

mapboxgl.accessToken = MAPBOXGL_ACCESS_TOKEN;

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    BudgetKeyCommonModule
  ],
  declarations: [
    KeysPipe,
    AppComponent,
    PageHeader,
    Summary,
    MapVisualization,
    CategoryVisualizationComponent,
    CategoryVisualizationInfoPopup
  ],
  providers: [
    BudgetKeyMainPage,
    {provide: MAPBOXGL_TOKEN, useValue: mapboxgl}
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
