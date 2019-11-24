import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { BudgetKeyCommonModule, LANG_TOKEN, THEME_ID_TOKEN } from 'budgetkey-ng2-components';
import { BrowserModule } from '@angular/platform-browser';
import { BudgetkeyNg2AuthModule } from 'budgetkey-ng2-auth';
import { MushonkeyModule } from 'mushonkey';
import { MainPageSummaryComponent } from './main-page-summary/main-page-summary.component';
import { CategoryVisualizationComponent } from './category-visualization/category-visualization.component';
import { HeroComponent } from './hero/hero.component';
import { CategoryVisualizationInfoPopupComponent } from './category-visualization-info-popup/category-visualization-info-popup.component';
import { BUBBLES } from './constants';
import { bubbles } from './bubbles';
import { SpeechBubbleComponent } from './speech-bubble/speech-bubble.component';


describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BudgetKeyCommonModule,
        BudgetkeyNg2AuthModule,
        MushonkeyModule,
      ],
      declarations: [
        AppComponent,
        MainPageSummaryComponent,
        CategoryVisualizationComponent,
        CategoryVisualizationInfoPopupComponent,
        HeroComponent,
        SpeechBubbleComponent,
      ],
      providers: [
        {provide: THEME_ID_TOKEN, useValue: 'budgetkey'},
        {provide: LANG_TOKEN, useValue: 'he'},
        {provide: BUBBLES, useValue: bubbles}
      ]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

});
