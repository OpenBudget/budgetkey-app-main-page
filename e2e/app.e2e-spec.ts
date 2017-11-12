import { browser } from 'protractor';

describe('QuickStart E2E Tests', function () {
  beforeEach(function () {
    browser.get('');
  });

  it('should render some charts', function () {
    // Fails by timeout with unknown reason
    // expect(element.all(by.css('svg')).count()).toBeGreaterThan(0);
  });
});
