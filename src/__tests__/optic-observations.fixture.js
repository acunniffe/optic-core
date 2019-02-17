const { flattenJavascriptValueToList } = require('../value-to-shape');

const pathObservations = [
  {
    'type': 'PathObserved',
    'path': '/',
  },
  {
    'type': 'MethodObserved',
    'path': '/',
    'method': 'POST',
  },
  {
    'type': 'StatusObserved',
    'path': '/',
    'method': 'POST',
    'statusCode': '200',
  }];

const singleRequestBody = (body) => [
  {
    type: 'RequestBodyObserved',
    method: 'POST',
    path: '/',
    statusCode: '200',
    contentType: 'application/json',
    bodyShape: flattenJavascriptValueToList(body),
  },
];

module.exports = {
  singleRequestBody,
  pathObservations,
};
