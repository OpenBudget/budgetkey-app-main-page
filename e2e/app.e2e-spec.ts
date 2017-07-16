import { browser, $$ } from 'protractor';

describe('QuickStart E2E Tests', function () {
  beforeEach(function () {
    browser.get('');
  });

  it('should render some charts', function () {
    expect($$('.category svg').count()).toBeGreaterThan(0);
  });
});
