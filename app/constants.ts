import { OpaqueToken } from '@angular/core';

export const MAPBOXGL_ACCESS_TOKEN = 'pk.eyJ1IjoibXVzaG9uIiwiYSI6IjY1bHhhTkEifQ.DhW2zcurHHBtmnc2FsMBqg';

export const MAPBOXGL_TOKEN = new OpaqueToken('mapboxgl');

export const CATEGORIES_THEMES = {
  'בטחון וסדר ציבורי': 'blue',
  'החזרי חוב': 'tan',
  'שירותים חברתיים': 'violet',
  'ענפי משק': 'olive',
  'משרדי מטה': 'orange',
  'הוצאות אחרות': 'yellow',
  'תשתיות': 'mint',
};
