'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const nunjucks = require('nunjucks');
const get_cache = require('./cache');

const basePath = process.env.BASE_PATH || '/';
const rootPath = path.resolve(__dirname, './dist/budgetkey-app-main-page');

const cachedThemes = {};
const cachedThemeJsons = {};

let bubbles = '{}';
get_cache()
  .then((data) => {
    bubbles = JSON.stringify(data);
  });

const app = express();
app.use(basePath, express.static(rootPath, {
  index: false,
  maxAge: '1d',
}));

nunjucks.configure(rootPath, {
  autoescape: true,
  express: app
});

app.set('port', process.env.PORT || 8000);

app.get(basePath + '*', function(req, res) {
  let injectedScript = '';

  // set language
  var lang = typeof(req.query.lang) !== "undefined" ? req.query.lang : 'he';
  injectedScript += `BUDGETKEY_LANG=${JSON.stringify(lang)};`;

  var theme = 'budgetkey';
  var themeFileName = `theme.${theme}.${lang}.json`;
  let toInject = cachedThemeJsons[themeFileName];
  let themeJson = cachedThemes[themeFileName];;
  if (!toInject) {
    // try the themes root directory first - this allows mount multiple themes in a single shared docker volume
    if (fs.existsSync(path.resolve('/themes', themeFileName))) {
      themeJson = JSON.parse(fs.readFileSync(path.resolve('/themes', themeFileName)));
    // fallback to local file - for local development / testing
    } else if (fs.existsSync(path.resolve(__dirname, themeFileName))) {
      themeJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, themeFileName)));
    } else {
      themeJson = {};
    }

    toInject = '';
    for (var key in themeJson) {
      toInject += `${key}=${JSON.stringify(themeJson[key])};`;
    }
    cachedThemes[themeFileName] = themeJson;
    cachedThemeJsons[themeFileName] = toInject;
  }

  injectedScript += toInject;
  injectedScript += `BUDGETKEY_THEME_ID=${JSON.stringify(req.query.theme)};`;

  var translationsFileName = `main_page.translations.${lang}.json`;
  toInject = cachedThemeJsons[translationsFileName];
  let translationsJson = cachedThemes[translationsFileName];;
  if (!toInject) {
    // try the themes root directory first - this allows mount multiple themes in a single shared docker volume
    if (fs.existsSync(path.resolve('/themes', translationsFileName))) {
      translationsJson = JSON.parse(fs.readFileSync(path.resolve('/themes', translationsFileName)));
    // fallback to local file - for local development / testing
    } else if (fs.existsSync(path.resolve(__dirname, translationsFileName))) {
      translationsJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, translationsFileName)));
    } else {
      translationsJson = {};
    }
    toInject = `TRANSLATIONS=${JSON.stringify(translationsJson)};`;
    cachedThemes[translationsFileName] = translationsJson;
    cachedThemeJsons[translationsFileName] = toInject;  
  }

  injectedScript += toInject;

  let doc_id = req.params[0];
  res.render('index.html', {
      base: basePath,
      bubbles: bubbles,
      injectedScript: injectedScript,
      doc_id: doc_id
  });
});

app.listen(app.get('port'), function() {
  console.log('Listening port ' + app.get('port'));
});
