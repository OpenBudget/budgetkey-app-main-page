import fetch from 'node-fetch';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { Response } from 'node-fetch';
import * as _ from 'lodash';
import * as Promise from 'bluebird';

const API_URL = 'http://next.obudget.org/api/query?query=';
const DOC_URL = 'http://next.obudget.org/get/';
const YEAR = 2018;
const BUDGET_CODE = '0020460418';

const RETURNS_CONDITION = `
((code LIKE '0084%%') AND NOT ((econ_cls_json->>0)::jsonb->>2='226'))
`;

const GOV_INDUSTIES_CONDITION = `
(code LIKE '0089%%' OR
 code LIKE '0091%%' OR
 code LIKE '0094%%' OR
 code LIKE '0095%%' OR
 code LIKE '0098%%')
`;

const EXPENSES_CONDITION = `length(code) = 10 AND year = ` + YEAR + ` 
AND NOT code LIKE '0000%%'  
AND NOT ` + GOV_INDUSTIES_CONDITION + `
AND NOT ` + RETURNS_CONDITION;

const DEFICIT_FUNDING_CONDITION = `
((func_cls_json->>0)::jsonb->>2='86')
`;

const INCOME_CONDITION = `length(code) = 10 AND year = ` + YEAR + ` 
AND code LIKE '0000%%'  
AND NOT ` + DEFICIT_FUNDING_CONDITION;

const SQL_FUNC_BUBBLES_DATA = `
  SELECT 
    func_cls_title_1->>0 AS bubble_group,
    func_cls_title_2->>0 AS bubble_title,
    sum(net_allocated) AS total_amount,
    'budget/C' || ((func_cls_json->>0)::json->>0) || ((func_cls_json->>0)::json->>2) || '/' || '`+YEAR+`' as doc_id,
    'https://next.obudget.org/i/budget/C' || ((func_cls_json->>0)::json->>0) || ((func_cls_json->>0)::json->>2) || '/' || '`+YEAR+`' as href
  FROM raw_budget
  WHERE ` + EXPENSES_CONDITION + `
  GROUP BY 1, 2, 4 ,5
  ORDER BY 1, 2
`;

const SQL_ECON_BUBBLES_DATA = `
  SELECT 
    econ_cls_title_1->>0 AS bubble_group,
    econ_cls_title_2->>0 AS bubble_title,
    sum(net_allocated) AS total_amount,
    'https://next.obudget.org/i/budget/E' || ((econ_cls_json->>0)::json->>0) || ((econ_cls_json->>0)::json->>2) || '/' || '`+YEAR+`' as href
  FROM raw_budget
  WHERE ` + EXPENSES_CONDITION + `
  GROUP BY 1, 2, 4
  HAVING sum(net_allocated) > 0
  ORDER BY 1, 2
`;

const SQL_INCOME_BUBBLES_DATA = `
  SELECT 
    (hierarchy->>1)::jsonb->>1 AS bubble_group,
    (hierarchy->>2)::jsonb->>1 AS bubble_title,
    sum(net_allocated) AS total_amount,
    'https://next.obudget.org/i/budget/' || ((hierarchy->>2)::jsonb->>0) || '/' || '`+YEAR+`' as href
  FROM raw_budget
  WHERE ` + INCOME_CONDITION + `
  GROUP BY 1, 2, 4
  HAVING sum(net_allocated) > 0
  ORDER BY 1, 2
`;

const SQL_INCOME_FUNCTIONS = `
  SELECT 
    func_cls_title_2->>0 as title,
    sum(net_allocated) as net_allocated
  FROM raw_budget
  WHERE ` + INCOME_CONDITION + `
  GROUP BY 1
  ORDER BY 2 desc
`;

const SUPPORTS_BUBBLES_DATA = `
  SELECT 
    entity_name,
    sum(amount_total) as total_amount,
    'https://next.obudget.org/i/org/' || entity_kind || '/' || entity_id as href
  FROM raw_supports
  WHERE budget_code='` + BUDGET_CODE + `' 
  AND year_paid=` + (YEAR - 1) + ` 
  AND entity_name is not null
  GROUP BY 1, 3 
  ORDER BY 2 desc
`;


declare type Row = {
  bubble_group: any;
  bubble_title: any;
  total_amount: any;
  href: any;
  doc_id: any;
}

declare type RecordSet = Array<Row>;

function cached_get_url(url: string): PromiseLike<any> {
  let filePath = 'build-cache/' + crypto.createHash('md5').update(url).digest('hex') + '.json';
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, content) => {
      if(err) {
        console.log('Couldn\'t find '+filePath);
        fetch(url)
        // Load data as JSON
          .then((response: Response) => response.text())
          .then((body: string) => {
            let parsed;
            try {
              parsed = JSON.parse(body);
            } catch (e) {
              console.log('ERRORED', url);
              fs.writeFileSync('errd', body);
              throw e;
            }
            fs.writeFileSync(filePath, body);
            resolve(parsed);
          });
      } else {
        console.log('Loaded from '+filePath);
        try {
          resolve(JSON.parse(content));
        } catch(err) {
          reject(err);
        }
      }
    })
  });
}

function fetch_sql(sql: string) {
  let url = API_URL + encodeURIComponent(sql);
  return cached_get_url(url)
    .then((data) => {
      return data.rows;
    });
}

function fetch_data(sql: string) {
  return fetch_sql(sql)
    // Collect data
    .then((data: RecordSet) => {
      let grouped = {};
      data.forEach(
        ({bubble_group, bubble_title, total_amount, href, doc_id}: Row) => {
          grouped[bubble_group] = grouped[bubble_group] || {};
          grouped[bubble_group][bubble_title] = {
            amount: total_amount,
            href: href,
            doc_id: doc_id,
          };
        }
      );
      return grouped;
    })
    // Do some preparations
    .then((data: any) => {
      let result: any[] = [];
      _.each(data, (values: any, key: string) => {
        result.push({
          name: key,
          values: values,
          amount: _.sum(_.map(_.values(values), (v: any) => v.amount)),
          percent: 0.0
        });
      });

      result = _.sortBy(result, (v: any) => -v.amount);
      let maxPercent = 0;
      let total = _.sum(_.map(result, (v: any) => v.amount));
      _.each(result, (item: any) => {
        item.percent = item.amount / total * 100;
        maxPercent = maxPercent > item.percent? maxPercent : item.percent;
      });
      _.each(result, (item: any) => {
        item.scale = Math.sqrt(item.percent / maxPercent);
      });

      result = _.filter(result, (v: any) => v.percent > 0.5);

      let others = {
        name: 'אחרים',
        values: {},
        amount: 0,
        percent: 0.0
      };
      for (let item of result) {
        if (item.percent < 5.0 && Object.keys(item.values).length == 1) {
          others.values = Object.assign(others.values, item.values);
          others.amount += item.amount;
          others.percent += item.percent;
        }
      }
      if (Object.keys(others.values).length > 0) {
        result = _.filter(result, (v: any) => !(v.percent < 5.0 && Object.keys(v.values).length == 1));
        result.push(others);
      }

      return result;
    });
}

function fetch_doc(doc: string) {
  let url = DOC_URL + doc;
  return cached_get_url(url)
    .then((data => data.value))
}

function deficitChart() {
  return Promise.all([
    fetch_doc('budget/00/' + YEAR),
    fetch_sql(`select sum(net_allocated) from raw_budget 
               where ` + EXPENSES_CONDITION),
    fetch_sql(`select sum(net_allocated) from raw_budget 
               where ` + INCOME_CONDITION),
    fetch_sql(`select sum(net_allocated) from raw_budget 
               where length(code) = 10 AND year = ` + YEAR + ` 
               AND ` + RETURNS_CONDITION),
    fetch_sql(`select sum(net_allocated) from raw_budget 
               where length(code) = 10 AND year = ` + YEAR + ` 
               AND ` + DEFICIT_FUNDING_CONDITION),
    fetch_sql(SQL_INCOME_FUNCTIONS),
  ]).then((data: any) => {
    return {
      budget: data[1][0].sum,
      expenseChildren: data[0].children,
      income: data[2][0].sum,
      returns: data[3][0].sum,
      deficitFunding: data[4][0].sum,
      incomeChildren: data[5],
    };
  });
}

function educationBudgetChart() {
  return Promise.all([
    fetch_doc('budget/0020/' + YEAR),
    fetch_doc('budget/002046/' + YEAR),
    fetch_doc('budget/00204604/' + YEAR),
  ]);
}

function supportsChart(): PromiseLike<any> {
  return Promise.all([
    fetch_sql(SUPPORTS_BUBBLES_DATA),
    fetch_doc('budget/' + BUDGET_CODE + '/' + YEAR)
  ]);
}

function fetchExplanations(func: any[]) {
  let promises = [];
  for (let t of func) {
    let v = t['values'];
    for (let t2 in v) {
      let v2 = v[t2];
      let p = fetch_doc(v2['doc_id'])
        .then((doc) => {
          v2['explanation'] = doc['explanation_short'];
          v2['explanation_source'] = doc['explanation_source'];
        });
      promises.push(p);
    }
  }
  return Promise.all(promises);
}

export default function() {
  let ret = {};
  return Promise.all([
      fetch_data(SQL_FUNC_BUBBLES_DATA),
      fetch_data(SQL_ECON_BUBBLES_DATA),
      fetch_data(SQL_INCOME_BUBBLES_DATA),
      deficitChart(),
      educationBudgetChart(),
      supportsChart()
    ]).then((data: any[]) => {
      ret = {
        year: YEAR,
        func: data[0],
        econ: data[1],
        income: data[2],
        deficitChart: data[3],
        educationCharts: data[4],
        supportChart: data[5]
      };
      return fetchExplanations(data[0]);
    }).then(() => {
      return {
        code: 'module.exports = ' + JSON.stringify(ret)
      };
    });
}
