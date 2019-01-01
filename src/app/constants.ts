import { InjectionToken } from '@angular/core';

export const VALUE_SCALE = {
  מיליארד: 1000000000,
  מיליון: 1000000,
  אלפי: 1000
};

export const DEFAULT_LOCALE = 'he-IL';

export const CATEGORIES_THEMES = {
  'בטחון וסדר ציבורי': 'blue',
  'החזרי חוב': 'tan',
  'שירותים חברתיים': 'violet',
  'ענפי משק': 'olive',
  'משרדי מטה': 'orange',
  'הוצאות אחרות': 'yellow',
  'תשתיות': 'mint',
};

export const BUBBLES = new InjectionToken('bubbles');
