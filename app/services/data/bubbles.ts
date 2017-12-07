import fetch from 'node-fetch';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { Response } from 'node-fetch';
import * as _ from 'lodash';
import * as Promise from 'bluebird';

const API_URL = 'http://next.obudget.org/api/query?query=';
const DOC_URL = 'http://next.obudget.org/get/';
const YEAR = 2018;

const SQL_FUNC_BUBBLES_DATA = `
  SELECT 
    func_cls_title_1->>0 AS bubble_group,
    func_cls_title_2->>0 AS bubble_title,
    sum(net_allocated) AS total_amount,
    'https://next.obudget.org/i/budget/C' || ((func_cls_json->>0)::json->>0) || ((func_cls_json->>0)::json->>2) || '/' || '`+YEAR+`' as href
  FROM raw_budget
  WHERE length(code) = 10 AND year = `+YEAR+` AND NOT code LIKE '0000%%'
  GROUP BY 1, 2, 4 
  ORDER BY 1, 2
`;

const SQL_ECON_BUBBLES_DATA = `
  SELECT 
    econ_cls_title_1->>0 AS bubble_group,
    econ_cls_title_2->>0 AS bubble_title,
    sum(net_allocated) AS total_amount,
    'https://next.obudget.org/i/budget/E' || ((econ_cls_json->>0)::json->>0) || ((econ_cls_json->>0)::json->>2) || '/' || '`+YEAR+`' as href
  FROM raw_budget
  WHERE length(code) = 10 AND year = `+YEAR+` AND NOT code LIKE '0000%%'
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
  WHERE length(code) = 10 AND year = `+YEAR+` AND code LIKE '0000%%'
  GROUP BY 1, 2, 4
  HAVING sum(net_allocated) > 0
  ORDER BY 1, 2
`;


declare type Row = {
  bubble_group: any;
  bubble_title: any;
  total_amount: any;
  href: any;
}

declare type RecordSet = {
  rows: Row[];
}

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
            fs.writeFileSync(filePath, body);
            resolve(JSON.parse(body));
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

function fetch_data(sql: string) {
  let url = API_URL + encodeURIComponent(sql);
  return cached_get_url(url)
    // Collect data
    .then((data: RecordSet) => {
      let grouped = {};
      data.rows.forEach(
        ({bubble_group, bubble_title, total_amount, href}: Row) => {
          grouped[bubble_group] = grouped[bubble_group] || {};
          grouped[bubble_group][bubble_title] = {
            amount: total_amount,
            href: href
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

      let total = _.sum(_.map(result, (v: any) => v.amount));
      _.each(result, (item: any) => {
        item.percent = item.amount / total * 100;
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
    fetch_doc('budget/00/'+YEAR),
    fetch_doc('budget/0000/'+YEAR)
  ]).then((data: any) => {
    return {
      budget: data[0].net_allocated,
      expenseChildren: data[0].children,
      income: data[1].net_allocated,
      incomeChildren: data[1].children
    };
  });
}

function educationBudgetChart() {
  return Promise.all([
    fetch_doc('budget/0020/'+YEAR),
    fetch_doc('budget/002043/'+YEAR),
    fetch_doc('budget/00204301/'+YEAR),
  ]).then((data: any) => {
    return {
      level1: data[0],
      level2: data[1],
      level3: data[2],
    };
  });
}

export default function() {
  return Promise.all([
      fetch_data(SQL_FUNC_BUBBLES_DATA),
      fetch_data(SQL_ECON_BUBBLES_DATA),
      fetch_data(SQL_INCOME_BUBBLES_DATA),
      deficitChart(),
      educationBudgetChart(),
    ]).then((data: any) => {
      data = {
        year: YEAR,
        func: data[0],
        econ: data[1],
        income: data[2],
        deficitChart: data[3],
        educationCharts: data[4],
      };
      return {
        code: 'module.exports = ' + JSON.stringify(data)
      };
    });
}
