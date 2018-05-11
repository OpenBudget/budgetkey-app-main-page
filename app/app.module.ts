import './rxjs-extensions';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';

import { BudgetKeyCommonModule } from 'budgetkey-ng2-components';

import { AppComponent }  from './app.component';
import {
  SummaryComponent,
  CategoryVisualizationComponent, 
  CategoryVisualizationInfoPopupComponent,
  HeroComponent
} from './components';

import { BudgetKeyMainPageService, UtilsService } from './services';

import { KeysPipe } from './pipes';

import {MushonkeyModule} from "mushonkey";


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
    SummaryComponent,
    CategoryVisualizationComponent,
    CategoryVisualizationInfoPopupComponent,
    HeroComponent
  ],
  providers: [
    BudgetKeyMainPageService,
    UtilsService,
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
