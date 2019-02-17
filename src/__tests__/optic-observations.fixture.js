const pathObservations = [{
  'type': 'PathObserved',
  'path': '/teams/:teamId/invite',
},
  {
    'type': 'MethodObserved',
    'path': '/teams/:teamId/invite',
    'method': 'POST',
  },
  {
    'type': 'StatusObserved',
    'path': '/teams/:teamId/invite',
    'method': 'POST',
    'statusCode': '200',
  }];

const singleRequestBody = (body) => [
  {
    type: 'RequestBodyObserved',
    method: 'POST',
    path: '/teams/:teamId/invite',
    statusCode: '200',
    contentType: 'application/json',
    body,
  },
];

module.exports = {
  singleRequestBody,
  pathObservations,
};
