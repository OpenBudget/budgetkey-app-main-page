'use strict';

const fetch_data = require('./cache');
const fs = require('fs');

fetch_data()
  .then((data) => {
      fs.writeFileSync('bubbles.json', JSON.stringify(data));
  });