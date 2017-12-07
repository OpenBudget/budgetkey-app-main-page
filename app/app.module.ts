import './rxjs-extensions';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';

import { BudgetKeyCommonModule } from 'budgetkey-ng2-components';

import { AppComponent }  from './app.component';
import {
  HeaderComponent, SummaryComponent, MapVisualizationComponent,
  CategoryVisualizationComponent, CategoryVisualizationInfoPopupComponent,
  HeroComponent
} from './components';

import { BudgetKeyMainPageService, UtilsService, ScrollyService } from './services';

import { KeysPipe } from './pipes';

import { MAPBOXGL_TOKEN, MAPBOXGL_ACCESS_TOKEN } from './constants';
import {MushonkeyModule} from "mushonkey";

/* global mapboxgl */
declare const mapboxgl: any;

mapboxgl.accessToken = MAPBOXGL_ACCESS_TOKEN;

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    BudgetKeyCommonModule,
    MushonkeyModule
  ],
  declarations: [
    KeysPipe,
    AppComponent,
    HeaderComponent,
    SummaryComponent,
    MapVisualizationComponent,
    CategoryVisualizationComponent,
    CategoryVisualizationInfoPopupComponent,
    HeroComponent
  ],
  providers: [
    BudgetKeyMainPageService,
    ScrollyService,
    UtilsService,
    {provide: MAPBOXGL_TOKEN, useValue: mapboxgl}
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
