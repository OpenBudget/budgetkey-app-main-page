import fetch from 'node-fetch';
import { Response } from 'node-fetch';
import * as _ from 'lodash';
import * as Promise from 'bluebird';

const API_URL = 'http://next.obudget.org/api/query?query=';

const SQL_FUNC_BUBBLES_DATA = `
  SELECT 
    func_cls_title_1->>0 AS bubble_group,
    func_cls_title_2->>0 AS bubble_title,
    sum(net_allocated) AS total_amount
  FROM raw_budget
  WHERE length(code) = 10 AND year = 2017 AND NOT code LIKE '0000%%'
  GROUP BY 1, 2 
  HAVING sum(net_allocated) > 0
  ORDER BY 1, 2
`;

const SQL_ECON_BUBBLES_DATA = `
  SELECT 
    econ_cls_title_1->>0 AS bubble_group,
    econ_cls_title_2->>0 AS bubble_title,
    sum(net_allocated) AS total_amount
  FROM raw_budget
  WHERE length(code) = 10 AND year = 2017 AND NOT code LIKE '0000%%'
  GROUP BY 1, 2 
  HAVING sum(net_allocated) > 0
  ORDER BY 1, 2
`;

const SQL_INCOME_BUBBLES_DATA = `
  SELECT 
    (hierarchy->>1)::jsonb->>1 AS bubble_group,
    (hierarchy->>2)::jsonb->>1 AS bubble_title,
    sum(net_allocated) AS total_amount
  FROM raw_budget
  WHERE length(code) = 10 AND year = 2017 AND code LIKE '0000%%'
  GROUP BY 1, 2 
  HAVING sum(net_allocated) > 0
  ORDER BY 1, 2
`;


declare type Row = {
  bubble_group: any;
  bubble_title: any;
  total_amount: any;
}

declare type RecordSet = {
  rows: Row[];
}

function fetch_data(sql: string) {
  let url = API_URL + encodeURIComponent(sql);
  return fetch(url)
    // Load data as JSON
    .then((response: Response) => response.json())
    // Collect data
    .then((data: RecordSet) => {
      let grouped = {};
      data.rows.forEach(
        ({bubble_group, bubble_title, total_amount}: Row) => {
          grouped[bubble_group] = grouped[bubble_group] || {};
          grouped[bubble_group][bubble_title] = total_amount;
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
          amount: _.sum(_.values(values)),
          percent: 0.0
        });
      });

      result = _.sortBy(result, (v: any) => -v.amount);

      let total = _.sum(_.map(result, (v: any) => v.amount));
      _.each(result, (item: any) => {
        item.percent = item.amount / total * 100;
      });

      result = _.filter(result, (v: any) => v.percent > 0.5);

      return result;
    });
}

export default function() {
  return Promise.all([
      fetch_data(SQL_FUNC_BUBBLES_DATA),
      fetch_data(SQL_ECON_BUBBLES_DATA),
      fetch_data(SQL_INCOME_BUBBLES_DATA),
    ]).then((data: any) => {
      data = {
        func: data[0],
        econ: data[1],
        income: data[2],
      };
      return {
        code: 'module.exports = ' + JSON.stringify(data)
      };
    });
}