import * as deepdash from 'deepdash';
import * as lodash from 'lodash';
import { Graph, Node, NodeId } from './graph';
import { Observation } from './interactions-to-observations';
import { stringType } from './generate-schema.js';

const _ = deepdash(lodash);

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
    data: { count: 1 },
  };
}

function ResponseNode(path: string, method: string, statusCode: number) {
  const type = 'response';

  return {
    type,
    id: `(${ResponseStatusCodeNode(path, method, statusCode).id})|(${type})`,
    data: { count: 1 },
  };
}

function SecurityNode() {
  const type = 'security';

  return {
    type,
    id: `(${type})`,
    data: {
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

/*
function BodyNode(parentNodeId: NodeId, contentType: string) {
  const type = 'body';

  return {
    type,
    id: `(${parentNodeId})|(${type}:${contentType})`,
    data: {
      count: 1,
    },
  };
}*/

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

class ObservationsToGraph {
  public readonly graph: Graph;

  constructor() {
    this.graph = new Graph();
    this.graph.addNode('root', 'root', {});
  }

  public interpretObservations(observations: Observation[]) {
    for (const observation of observations) {
      if (observation.type === 'PathObserved') {
        const { path } = observation;
        const node = PathNode(path);
        if (this.graph.tryAddNode(node.id, node.type, node.data)) {
          this.graph.addEdge(node.id, 'root');
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
          this.graph.addEdge(requestNode.id, node.id);
          const responseNode = ResponseNode(path, method, statusCode);
          this.graph.addEdge(responseNode.id, node.id);
        }
      } else if (observation.type === 'SecurityObserved') {
        const { path, method, statusCode } = observation;
        const node = SecurityNode();
        if (this.graph.tryAddNode(node.id, node.type, node.data)) {
          const requestNode = RequestNode(path, method, statusCode);
          this.graph.ensureEdgeExistsBetween(requestNode.id, node.id);
        }
      } else if (observation.type === 'RequestParameterObserved') {
        const { path, method, statusCode, source, name, value } = observation;
        const node = RequestParameterNode(path, method, statusCode, source, name);
        const schemaRootNode = SchemaRootNode(node.id);

        if (this.graph.tryAddNode(node.id, node.type, node.data)) {
          const requestNode = RequestNode(path, method, statusCode);
          this.graph.addEdge(node.id, requestNode.id);

          this.graph.addNode(schemaRootNode.id, schemaRootNode.type, schemaRootNode.data);
          console.log('\n');
          console.log({ name, value });
        }
        this.mergeSchema(schemaRootNode, value);
        console.log('\nCHECKPOINT\n\n\n\n');
      }
      // RequestBody Observed
      // ResponseBody Observed
    }
  }

  private mergeSchema(parentNode: Node, value: any) {
    const list = this.flattenJavascriptValueToList(value);
    console.log(parentNode.id, { list });
    const nodesByPath: Map<string, Node> = new Map();
    let currentParent = parentNode;
    console.log('\n');
    for (const item of list) {
      console.log({ item, currentParent });
      let node: Node;
      if (item.jsonSchemaType !== 'array' && item.jsonSchemaType !== 'object') {
        // @ts-ignore
        if (currentParent.data.jsonSchemaType === 'object') {
          const propertyNode = ObjectPropertyNode(currentParent.id, item.key);
          if (this.graph.tryAddNode(propertyNode.id, propertyNode.type, propertyNode.data)) {
            this.graph.addEdge(propertyNode.id, currentParent.id);
          }
          currentParent = propertyNode;
        }
        node = SchemaLeafNode(currentParent.id, item.jsonSchemaType);
      } else {
        node = SchemaParentNode(currentParent.id, item.jsonSchemaType);
        currentParent = node;
      }

      if (this.graph.tryAddNode(node.id, node.type, node.data)) {
        nodesByPath.set(item.path, node);
        console.log({ nodesByPath });
        console.log('\n');
        if (item.parentPath !== null) {
          currentParent = nodesByPath.get(item.parentPath);
          this.graph.addEdge(node.id, currentParent.id);
        }
      }
    }
  }

  private flattenJavascriptValueToList(x: any) {
    const list = [
      { key: '', parentPath: null, path: '', depth: 0, jsonSchemaType: this.jsonSchemaTypeString(x) },
    ];

    _.eachDeep(x, (value: any, key: string, path: string, depth: number, _parent: any, _parentKey: string, parentPath: string) => {
      list.push({
        key, path, depth: depth + 1, parentPath, jsonSchemaType: this.jsonSchemaTypeString(value),
      });
    });

    return list;
  }

  private jsonSchemaTypeString(value: any) {
    return stringType(value).toLowerCase();
  }
}

export {
  ObservationsToGraph,
};
