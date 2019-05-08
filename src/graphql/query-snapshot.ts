import { execute, parse } from 'graphql';
import { schema } from './schema';

function defaultQuery(snapshotId: string) {
  return `
            query {
                snapshot(snapshotId: "${snapshotId}") {
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
                    }
                }
            }
            `;
}

function observationsToGqlResponse(observations, query) {

  const snapshotRepository = {
    findById: () => Promise.resolve({ observations }),
  };

  const promise = execute(schema, parse(query), {}, { snapshotRepository });

  return promise;
}

export {
  defaultQuery,
  observationsToGqlResponse,
};
