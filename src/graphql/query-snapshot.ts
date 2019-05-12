import { execute, parse } from 'graphql';
import { schema } from './schema';

const fragment = `
endpoints {
    nameKey
    path
    method
    securityDefinitions {
        nameKey
        definition
    }
    request {
        nameKey
        headerParameters {
            nameKey
            name
            schema {
                asJsonSchema
            }
        }
        pathParameters {
            nameKey
            name
            schema {
                asJsonSchema
            }
        }
        queryParameters {
            nameKey
            name
            schema {
                asJsonSchema
            }
        }
        bodies {
            nameKey
            contentType
            schema {
                asJsonSchema
            }
        }
    }
    responses {
        nameKey
        statusCode
        bodies {
            nameKey
            contentType
            schema {
                asJsonSchema
            }
        }
    }
}
securityDefinitions {
    nameKey
    definition
}`;

function defaultQuery(snapshotId: string) {
  return `
query {
  snapshot(snapshotId: "${snapshotId}") {
      ${fragment}
  }
}
`;
}

function graphToGqlResponse(graph) {
  const query = `
query {
  snapshotFromGraphContext {
    ${fragment}
  }
}  
  `;
  const promise = execute(schema, parse(query), {}, { graph });

  return promise;
}

const defaultSnapshotRepository = function(observations) {
  return {
    findById: () => Promise.resolve({ observations }),
  };
};

function observationsToGqlResponse(snapshotRepository, query) {
  const promise = execute(schema, parse(query), {}, { snapshotRepository });

  return promise;
}

export {
  defaultQuery,
  defaultSnapshotRepository,
  graphToGqlResponse,
  observationsToGqlResponse,
};
