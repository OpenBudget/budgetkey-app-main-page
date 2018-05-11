import { browser, $$, ExpectedConditions as until } from 'protractor';

describe('QuickStart E2E Tests', function () {
  beforeEach(function () {
    browser.get('');
    browser.wait(until.presenceOf($$('.speech-bubble').first()),
                 5000,
                 'Element taking too long to appear in the DOM');
  });

  it('should render some charts', function () {
    // expect($$('.category-visualizations').first().toBeDefined());
  });
});
