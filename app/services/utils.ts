import { Injectable } from '@angular/core';
import * as _ from 'lodash';

import { VALUE_SCALE, DEFAULT_LOCALE } from '../constants';

const suffixes = _.chain(<any>VALUE_SCALE)
  .map((value: any, key: string) => {
    value = parseInt(value, 10) || 0;
    if (value > 0) {
      return [value, _.trim(key)];
    }
    return null;
  })
  .filter(_.identity)
  .sortBy((item: [number, string]) => {
    return item[0];
  })
  .reverse()
  .value();

@Injectable()
export class UtilsService {

  formatNumber(
    value: number, fractionDigits: number,
    trimTrailingZeros = true, locale: string | null = DEFAULT_LOCALE
  ): string {
    let result = Number(value).toFixed(fractionDigits);
    if (locale) {
      result = Number(result).toLocaleString(locale);
    }
    if (trimTrailingZeros && (result.indexOf('.') !== -1)) {
      result = result.replace(/0+$/, '').replace(/\.$/, '');
    }
    return result;
  }

  formatValue(
    value: number, fractionDigits: number,
    trimTrailingZeros = true, locale: string | null = DEFAULT_LOCALE
  ): string {
    let suffix = '';
    for (let i = 0; i < suffixes.length; i++) {
      if (Math.abs(value) >= suffixes[i][0]) {
        value = value / suffixes[i][0];
        suffix = suffixes[i][1];
        break;
      }
    }

    return this.formatNumber(value, fractionDigits, trimTrailingZeros, locale) +
      (suffix !== '' ? ' ' + suffix : '');
  };

  bareFormatValue(
    value: number, fractionDigits: number,
    trimTrailingZeros = true, locale: string | null = DEFAULT_LOCALE
  ): string {
    for (let i = 0; i < suffixes.length; i++) {
      if (Math.abs(value) >= suffixes[i][0]) {
        value = value / suffixes[i][0];
        break;
      }
    }
    return this.formatNumber(value, fractionDigits, trimTrailingZeros, locale);
  };

  getValueSuffix(value: number): string | null {
    for (let i = 0; i < suffixes.length; i++) {
      if (Math.abs(value) >= suffixes[i][0]) {
        value = value / suffixes[i][0];
        return suffixes[i][1];
      }
    }
    return null;
  };

}
