import './rxjs-extensions';

import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {HttpModule} from "@angular/http";

import { AppComponent }  from './app.component';

import { BudgetKeyCommonModule } from 'budgetkey-ng2-components';
import { BudgetPanel } from './budgetpanel.component';
import { CategoryComponent } from './category.component';

@NgModule({
  imports:      [
    BrowserModule,
    HttpModule,
    BudgetKeyCommonModule
  ],
  declarations: [
    AppComponent,
    CategoryComponent,
    BudgetPanel    
  ],
  providers: [
  ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
