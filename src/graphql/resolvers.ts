import { ApiBodyNode } from '../graph/nodes/api-body-node';
import { ApiPathNode } from '../graph/nodes/api-path-node';
import { ApiRequestParameterNode } from '../graph/nodes/api-request-parameter-node';
import { ApiResponseNode } from '../graph/nodes/api-response-node';
import { ApiSecurityDefinitionNode } from '../graph/nodes/api-security-definition-node';
import { ObservationsToGraphBuilder } from '../observations-to-graph';
import { GraphQueries, NodeQueries } from '../graph/graph-queries';
import GraphQLJSON from 'graphql-type-json';


function nameKey(nodeQueries) {
  return nodeQueries.node.value.hashCode();
}

const resolvers = {
  Query: {
    snapshotFromGraphContext: (_, _args, context) => {
      return new GraphQueries(context.graph);
    },
    snapshot: (_, args, context) => {
      const { snapshotId } = args;
      const { snapshotRepository } = context;

      return snapshotRepository
        .findById(snapshotId)
        .then(({ observations }) => {
          const observationsToGraph = ObservationsToGraphBuilder.fromEmptyGraph();
          observationsToGraph.interpretObservations(observations);
          const graphQueries = new GraphQueries(observationsToGraph.graph);

          return graphQueries;
        });
    },
  },
  Snapshot: {
    endpoints(graphQueries: GraphQueries) {
      const endpoints = graphQueries.listNodesByType('method');
      return endpoints;
    },
    securityDefinitions(graphQueries: GraphQueries) {
      const securityDefinitions = graphQueries.listNodesByType('api')[0]
        .children()
        .filter(x => x.isA('securityDefinition'));
      return securityDefinitions;
    },
  },
  Endpoint: {
    nameKey,
    path(nodeQueries: NodeQueries) {
      return (nodeQueries.parent().node.value as ApiPathNode).path;
    },
    method(nodeQueries: NodeQueries) {
      return (nodeQueries.node.value as ApiPathNode).method;
    },
    securityDefinitions(nodeQueries: NodeQueries) {
      const allSecurityDefinitions = nodeQueries.graphQueries
        .listNodesByType('securityDefinition');
      // likely have a bug here
      const requestNode = nodeQueries
        .descendants()
        .find(x => x.isA('request'));
      const securityDefinitionsForEndpoint = allSecurityDefinitions
        .filter(x => requestNode.isChildOf(x.node.id));

      return securityDefinitionsForEndpoint;
    },
    request(nodeQueries: NodeQueries) {
      const successfulResponse = nodeQueries
        .descendants()
        .find(x => {
          const { value } = x.node;
          const isSuccessfulResponse = x.isA('responseStatusCode') && value.statusCode >= 200 && value.statusCode < 300;
          return isSuccessfulResponse;
        });

      if (!successfulResponse) {
        return null;
      }

      const request = successfulResponse.children().find(x => x.isA('request'));
      return request;
    },
    responses(nodeQueries: NodeQueries) {
      const responseStatusCodes = nodeQueries
        .descendants()
        .filter(x => x.isA('response'));
      return responseStatusCodes;
    },
  },
  SecurityDefinition: {
    nameKey,
    definition(nodeQueries: NodeQueries) {
      return (nodeQueries.node.value as ApiSecurityDefinitionNode).security;
    },
  },
  Response: {
    nameKey,
    statusCode(nodeQueries: NodeQueries) {
      return (nodeQueries.parent().node.value as ApiResponseNode).statusCode;
    },
    bodies(nodeQueries: NodeQueries) {
      const bodies = nodeQueries
        .children()
        .filter(x => x.isA('body'));
      return bodies;
    },
  },
  Request: {
    nameKey,
    headerParameters(nodeQueries: NodeQueries) {
      const headerParameters = nodeQueries
        .children()
        .filter(x => x.isA('requestParameter'))
        .filter(x => (x.node.value as ApiRequestParameterNode).source === 'header');
      return headerParameters;
    },
    pathParameters(nodeQueries: NodeQueries) {
      const pathParameters = nodeQueries
        .children()
        .filter(x => x.isA('requestParameter'))
        .filter(x => (x.node.value as ApiRequestParameterNode).source === 'path');
      return pathParameters;
    },
    queryParameters(nodeQueries: NodeQueries) {
      const queryParameters = nodeQueries
        .children()
        .filter(x => x.isA('requestParameter'))
        .filter(x => (x.node.value as ApiRequestParameterNode).source === 'query');
      return queryParameters;
    },
    bodies(nodeQueries: NodeQueries) {
      const bodies = nodeQueries
        .children()
        .filter(x => x.isA('body'));
      return bodies;
    },
  },
  HeaderParameter: {
    nameKey,
    name(nodeQueries: NodeQueries) {
      return (nodeQueries.node.value as ApiRequestParameterNode).name;
    },
    schema(nodeQueries: NodeQueries) {
      return nodeQueries
        .children()
        .find(x => x.isA('schemaRoot'));
    },
  },
  PathParameter: {
    nameKey,

    name(nodeQueries: NodeQueries) {
      return (nodeQueries.node.value as ApiRequestParameterNode).name;
    },
    schema(nodeQueries: NodeQueries) {
      return nodeQueries
        .children()
        .find(x => x.isA('schemaRoot'));
    },
  },
  QueryParameter: {
    nameKey,
    name(nodeQueries: NodeQueries) {
      return (nodeQueries.node.value as ApiRequestParameterNode).name;
    },
    schema(nodeQueries: NodeQueries) {
      return nodeQueries
        .children()
        .find(x => x.isA('schemaRoot'));
    },
  },
  ResponseBody: {
    nameKey,
    contentType(nodeQueries: NodeQueries) {
      return (nodeQueries.node.value as ApiBodyNode).contentType;
    },
    schema(nodeQueries: NodeQueries) {
      return nodeQueries
        .children()
        .find(x => x.isA('schemaRoot'));
    },
  },
  RequestBody: {
    nameKey,
    contentType(nodeQueries: NodeQueries) {
      return (nodeQueries.node.value as ApiBodyNode).contentType;
    },
    schema(nodeQueries: NodeQueries) {
      return nodeQueries
        .children()
        .find(x => x.isA('schemaRoot'));
    },
  },
  JsonSchemaLike: {
    asJsonSchema(nodeQueries: NodeQueries) {
      const schema = nodeQueries.toJsonSchema();

      return schema;
    },
  },
  JSON: GraphQLJSON,
};

export {
  resolvers,
};
