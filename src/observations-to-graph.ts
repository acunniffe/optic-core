import { ISecurityConfig } from './session-manager';
import { Graph, Node, NodeId, rootNodeId } from './graph/graph';
import { Observation } from './interactions-to-observations';
import { IFlattenedJsValueItem } from './value-to-shape';

function PathNode(path: string) {
  const type = 'path';

  return {
    type,
    id: `(${type}:${path})`,
    data: {
      path,
      count: 1,
    },
  };
}

function MethodNode(path: string, method: string) {
  const type = 'method';

  return {
    type,
    id: `(${PathNode(path).id})|(${type}:${method})`,
    data: {
      method,
      count: 1,
    },
  };
}

function ResponseStatusCodeNode(path: string, method: string, statusCode: number) {
  const type = 'responseStatusCode';

  return {
    type,
    id: `(${MethodNode(path, method).id})|(${type}:${statusCode})`,
    data: {
      statusCode,
      count: 1,
    },
  };
}

function RequestNode(path: string, method: string, statusCode: number) {
  const type = 'request';

  return {
    type,
    id: `(${ResponseStatusCodeNode(path, method, statusCode).id})|(${type})`,
    data: {
      count: 1,
    },
  };
}

function ResponseNode(path: string, method: string, statusCode: number) {
  const type = 'response';

  return {
    type,
    id: `(${ResponseStatusCodeNode(path, method, statusCode).id})|(${type})`,
    data: {
      count: 1,
    },
  };
}

function SecurityNode(security: ISecurityConfig) {
  const type = 'securityDefinition';

  return {
    type,
    id: `(${type})`,
    data: {
      security,
      count: 1,
    },
  };
}

function RequestParameterNode(path: string, method: string, statusCode: number, source: string, name: string) {
  const type = 'requestParameter';

  return {
    type,
    id: `(${RequestNode(path, method, statusCode).id})|(${type}:${name}:${source})`,
    data: {
      source,
      name,
      count: 1,
    },
  };
}

function SchemaRootNode(parentNodeId: NodeId) {
  const type = 'schemaRoot';

  return {
    type,
    id: `(${parentNodeId})|(${type})`,
    data: {
      count: 1,
    },
  };
}

function BodyNode(parentNodeId: NodeId, contentType: string) {
  const type = 'body';

  return {
    type,
    id: `(${parentNodeId})|(${type}:${contentType})`,
    data: {
      contentType,
      count: 1,
    },
  };
}

function SchemaParentNode(parentNodeId: NodeId, jsonSchemaType: string) {
  const type = 'schemaParent';

  return {
    type,
    id: `(${parentNodeId})|(${type}:${jsonSchemaType})`,
    data: {
      jsonSchemaType,
    },
  };
}

function ObjectPropertyNode(parentNodeId: NodeId, name: string) {
  const type = 'objectProperty';

  return {
    type,
    id: `(${parentNodeId})|(${type}:${name})`,
    data: {
      name,
    },
  };
}

function SchemaLeafNode(parentNodeId: NodeId, jsonSchemaType: string) {
  const type = 'schemaLeaf';

  return {
    type,
    id: `(${parentNodeId})|(${type}:${jsonSchemaType})`,
    data: {
      jsonSchemaType,
      count: 1,
    },
  };
}

function ResponseHeaderNode(parentNodeId: string, name: string) {
  const type = 'responseHeader';
  return {
    type,
    id: `(${parentNodeId}|(${type}:${name})`,
    data: {
      name,
      count: 1,
    },
  };
}

function ResponseCookieNode(parentNodeId: string, name: string) {
  const type = 'responseCookie';
  return {
    type,
    id: `(${parentNodeId}|(${type}:${name})`,
    data: {
      name,
      count: 1,
    },
  };
}

class ObservationsToGraph {
  public readonly graph: Graph;

  constructor() {
    this.graph = new Graph();
    this.graph.addNode(rootNodeId, rootNodeId, {});
  }

  public interpretObservations(observations: Observation[]) {
    for (const observation of observations) {
      if (observation.type === 'PathObserved') {
        const { path } = observation;
        const node = PathNode(path);
        if (this.graph.tryAddNode(node.id, node.type, node.data)) {
          this.graph.addEdge(node.id, rootNodeId);
        }
      } else if (observation.type === 'MethodObserved') {
        const { path, method } = observation;
        const node = MethodNode(path, method);
        if (this.graph.tryAddNode(node.id, node.type, node.data)) {
          const parentPathId = PathNode(path).id;
          this.graph.addEdge(node.id, parentPathId);
        }
      } else if (observation.type === 'StatusObserved') {
        const { path, method, statusCode } = observation;
        const node = ResponseStatusCodeNode(path, method, statusCode);
        if (this.graph.tryAddNode(node.id, node.type, node.data)) {
          const parentMethodId = MethodNode(path, method).id;
          this.graph.addEdge(node.id, parentMethodId);
          const requestNode = RequestNode(path, method, statusCode);
          this.graph.addNode(requestNode.id, requestNode.type, requestNode.data);
          this.graph.addEdge(requestNode.id, node.id);
          const responseNode = ResponseNode(path, method, statusCode);
          this.graph.addNode(responseNode.id, responseNode.type, responseNode.data);
          this.graph.addEdge(responseNode.id, node.id);
        }
      } else if (observation.type === 'SecurityObserved') {
        const { path, method, statusCode, security } = observation;
        const node = SecurityNode(security);
        if (this.graph.tryAddNode(node.id, node.type, node.data)) {
          this.graph.addEdge(node.id, rootNodeId);
          const requestNode = RequestNode(path, method, statusCode);
          this.graph.ensureEdgeExistsBetween(requestNode.id, node.id);
        }
      } else if (observation.type === 'RequestParameterObserved') {
        const { path, method, statusCode, source, name, valueShape } = observation;
        const node = RequestParameterNode(path, method, statusCode, source, name);
        const schemaRootNode = SchemaRootNode(node.id);

        if (this.graph.tryAddNode(node.id, node.type, node.data)) {
          const requestNode = RequestNode(path, method, statusCode);
          this.graph.addEdge(node.id, requestNode.id);

          this.graph.addNode(schemaRootNode.id, schemaRootNode.type, schemaRootNode.data);
          this.graph.addEdge(schemaRootNode.id, node.id);
        }
        this.mergeSchema(schemaRootNode, valueShape);
      } else if (observation.type === 'RequestBodyObserved') {
        const { path, method, statusCode, contentType, bodyShape } = observation;
        const requestNode = RequestNode(path, method, statusCode);
        const node = BodyNode(requestNode.id, contentType);
        const schemaRootNode = SchemaRootNode(node.id);
        if (this.graph.tryAddNode(node.id, node.type, node.data)) {
          this.graph.addEdge(node.id, requestNode.id);

          this.graph.addNode(schemaRootNode.id, schemaRootNode.type, schemaRootNode.data);
          this.graph.addEdge(schemaRootNode.id, node.id);
        }
        this.mergeSchema(schemaRootNode, bodyShape);
      } else if (observation.type === 'ResponseBodyObserved') {
        const { path, method, statusCode, contentType, bodyShape } = observation;
        const responseNode = ResponseNode(path, method, statusCode);
        const node = BodyNode(responseNode.id, contentType);
        const schemaRootNode = SchemaRootNode(node.id);
        if (this.graph.tryAddNode(node.id, node.type, node.data)) {
          this.graph.addEdge(node.id, responseNode.id);

          this.graph.addNode(schemaRootNode.id, schemaRootNode.type, schemaRootNode.data);
          this.graph.addEdge(schemaRootNode.id, node.id);
        }
        this.mergeSchema(schemaRootNode, bodyShape);
      } else if (observation.type === 'ResponseHeaderObserved') {
        const { path, method, statusCode, name, valueShape } = observation;
        const responseNode = ResponseNode(path, method, statusCode);
        const node = ResponseHeaderNode(responseNode.id, name);
        const schemaRootNode = SchemaRootNode(node.id);
        if (this.graph.tryAddNode(node.id, node.type, node.data)) {
          this.graph.addEdge(node.id, responseNode.id);

          this.graph.addNode(schemaRootNode.id, schemaRootNode.type, schemaRootNode.data);
          this.graph.addEdge(schemaRootNode.id, node.id);
        }
        this.mergeSchema(schemaRootNode, valueShape);
      } else if (observation.type === 'ResponseCookieObserved') {
        const { path, method, statusCode, name, valueShape } = observation;
        const responseNode = ResponseNode(path, method, statusCode);
        const node = ResponseCookieNode(responseNode.id, name);
        const schemaRootNode = SchemaRootNode(node.id);
        if (this.graph.tryAddNode(node.id, node.type, node.data)) {
          this.graph.addEdge(node.id, responseNode.id);

          this.graph.addNode(schemaRootNode.id, schemaRootNode.type, schemaRootNode.data);
          this.graph.addEdge(schemaRootNode.id, node.id);
        }
        this.mergeSchema(schemaRootNode, valueShape);
      }
    }
  }

  private mergeSchema(parentNode: Node, list: IFlattenedJsValueItem[]) {
    const nodesByPath: Map<string, Node> = new Map();
    let currentParent = parentNode;
    for (const item of list) {

      if (item.parentPath !== null) {
        currentParent = nodesByPath.get(item.parentPath);
      }

      let node: Node;
      // @ts-ignore
      if (currentParent.data.jsonSchemaType === 'object') {
        const propertyNode = ObjectPropertyNode(currentParent.id, item.key);
        if (this.graph.tryAddNode(propertyNode.id, propertyNode.type, propertyNode.data)) {
          this.graph.addEdge(propertyNode.id, currentParent.id);
        }
        currentParent = propertyNode;
      }
      if (item.jsonSchemaType !== 'array' && item.jsonSchemaType !== 'object') {
        node = SchemaLeafNode(currentParent.id, item.jsonSchemaType);
        if (this.graph.tryAddNode(node.id, node.type, node.data)) {
          this.graph.addEdge(node.id, currentParent.id);
        }
      } else {
        node = SchemaParentNode(currentParent.id, item.jsonSchemaType);
        if (this.graph.tryAddNode(node.id, node.type, node.data)) {
          this.graph.addEdge(node.id, currentParent.id);
        }
      }
      nodesByPath.set(item.path, node);
    }
  }
}

export {
  ObservationsToGraph,
};
