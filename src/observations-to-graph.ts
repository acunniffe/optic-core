import { Graph, NodeId } from './graph/graph';
import { ApiRootNode } from './graph/nodes/api-root-node';
import { ApiBodyNode } from './graph/nodes/api-body-node';
import { ApiMethodNode } from './graph/nodes/api-method-node';
import { ApiObjectPropertyNode } from './graph/nodes/api-object-property-node';
import { ApiPathNode } from './graph/nodes/api-path-node';
import { ApiRequestNode } from './graph/nodes/api-request-node';
import { ApiRequestParameterNode } from './graph/nodes/api-request-parameter-node';
import { ApiResponseCookieNode } from './graph/nodes/api-response-cookie-node';
import { ApiResponseHeaderNode } from './graph/nodes/api-response-header-node';
import { ApiResponseNode } from './graph/nodes/api-response-node';
import { ApiResponseStatusCodeNode } from './graph/nodes/api-response-status-code-node';
import { ApiSchemaLeafNode } from './graph/nodes/api-schema-leaf-node';
import { ApiSchemaParentNode } from './graph/nodes/api-schema-parent-node';
import { ApiSchemaRootNode } from './graph/nodes/api-schema-root-node';
import { ApiSecurityDefinitionNode } from './graph/nodes/api-security-definition-node';
import { Observation } from './interactions-to-observations';
import { IFlattenedJsValueItem } from './value-to-shape';

class ObservationsToGraph {
  public readonly graph: Graph;

  constructor() {
    this.graph = new Graph();
    const root = new ApiRootNode();
    this.graph.addNode(root);
  }

  public interpretObservations(observations: Observation[]) {
    for (const observation of observations) {
      if (observation.type === 'PathObserved') {
        const { path } = observation;
        const node = new ApiPathNode(path);
        const nodeId = this.graph.tryAddNode(node);
        if (nodeId) {
          const rootNodeId = this.graph.idFromHash(new ApiRootNode());
          this.graph.addEdge(nodeId, rootNodeId);
        }
      } else if (observation.type === 'MethodObserved') {
        const { path, method } = observation;
        const node = new ApiMethodNode(path, method);
        const nodeId = this.graph.tryAddNode(node);
        if (nodeId) {
          const parentPathId = this.graph.idFromHash(new ApiPathNode(path));
          this.graph.addEdge(nodeId, parentPathId);
        }
      } else if (observation.type === 'StatusObserved') {
        const { path, method, statusCode } = observation;
        const node = new ApiResponseStatusCodeNode(path, method, statusCode);
        const nodeId = this.graph.tryAddNode(node);
        if (nodeId) {
          const parentMethodId = this.graph.idFromHash(new ApiMethodNode(path, method));
          this.graph.addEdge(nodeId, parentMethodId);
          const requestNode = new ApiRequestNode(path, method, statusCode);
          const requestNodeId = this.graph.addNode(requestNode);
          this.graph.addEdge(requestNodeId, nodeId);
          const responseNode = new ApiResponseNode(path, method, statusCode);
          const responseNodeId = this.graph.addNode(responseNode);
          this.graph.addEdge(responseNodeId, nodeId);
        }
      } else if (observation.type === 'SecurityObserved') {
        const { path, method, statusCode, security } = observation;
        const node = new ApiSecurityDefinitionNode(security);
        let nodeId = this.graph.tryAddNode(node);
        if (nodeId) {
          const rootNodeId = this.graph.idFromHash(new ApiRootNode());
          this.graph.addEdge(nodeId, rootNodeId);
        } else {
          nodeId = this.graph.idFromHash(node);
        }
        const requestNode = new ApiRequestNode(path, method, statusCode);
        const requestNodeId = this.graph.idFromHash(requestNode);
        this.graph.ensureEdgeExistsBetween(requestNodeId, nodeId);
      } else if (observation.type === 'RequestParameterObserved') {
        const { path, method, statusCode, source, name, valueShape } = observation;
        const node = new ApiRequestParameterNode(path, method, statusCode, source, name);
        const nodeId = this.graph.tryAddNode(node);
        const schemaRootNode = new ApiSchemaRootNode(node.hashCode());
        if (nodeId) {
          const requestNodeId = this.graph.idFromHash(new ApiRequestNode(path, method, statusCode));
          this.graph.addEdge(nodeId, requestNodeId);

          const schemaRootNodeId = this.graph.addNode(schemaRootNode);
          this.graph.addEdge(schemaRootNodeId, nodeId);
        }
        this.mergeSchema(schemaRootNode, valueShape);
      } else if (observation.type === 'RequestBodyObserved') {
        const { path, method, statusCode, contentType, bodyShape } = observation;
        const requestNode = new ApiRequestNode(path, method, statusCode);
        const requestNodeId = this.graph.idFromHash(requestNode);
        const node = new ApiBodyNode(requestNode.hashCode(), contentType);
        const nodeId = this.graph.tryAddNode(node);
        const schemaRootNode = new ApiSchemaRootNode(node.hashCode());
        if (nodeId) {
          this.graph.addEdge(nodeId, requestNodeId);

          const schemaRootNodeId = this.graph.addNode(schemaRootNode);
          this.graph.addEdge(schemaRootNodeId, nodeId);
        }
        this.mergeSchema(schemaRootNode, bodyShape);
      } else if (observation.type === 'ResponseBodyObserved') {
        const { path, method, statusCode, contentType, bodyShape } = observation;
        const responseNode = new ApiResponseNode(path, method, statusCode);
        const responseNodeId = this.graph.idFromHash(responseNode);
        const node = new ApiBodyNode(responseNode.hashCode(), contentType);
        const nodeId = this.graph.tryAddNode(node);
        const schemaRootNode = new ApiSchemaRootNode(node.hashCode());
        if (nodeId) {
          this.graph.addEdge(nodeId, responseNodeId);

          const schemaRootNodeId = this.graph.addNode(schemaRootNode);
          this.graph.addEdge(schemaRootNodeId, nodeId);
        }
        this.mergeSchema(schemaRootNode, bodyShape);
      } else if (observation.type === 'ResponseHeaderObserved') {
        const { path, method, statusCode, name, valueShape } = observation;
        const responseNode = new ApiResponseNode(path, method, statusCode);
        const responseNodeId = this.graph.idFromHash(responseNode);
        const node = new ApiResponseHeaderNode(responseNode.hashCode(), name);
        const nodeId = this.graph.tryAddNode(node);
        const schemaRootNode = new ApiSchemaRootNode(node.hashCode());
        if (nodeId) {
          this.graph.addEdge(nodeId, responseNodeId);

          const schemaRootNodeId = this.graph.addNode(schemaRootNode);
          this.graph.addEdge(schemaRootNodeId, nodeId);
        }
        this.mergeSchema(schemaRootNode, valueShape);
      } else if (observation.type === 'ResponseCookieObserved') {
        const { path, method, statusCode, name, valueShape } = observation;
        const responseNode = new ApiResponseNode(path, method, statusCode);
        const responseNodeId = this.graph.idFromHash(responseNode);
        const node = new ApiResponseCookieNode(responseNode.hashCode(), name);
        const nodeId = this.graph.tryAddNode(node);
        const schemaRootNode = new ApiSchemaRootNode(node.hashCode());
        if (nodeId) {
          this.graph.addEdge(nodeId, responseNodeId);

          const schemaRootNodeId = this.graph.addNode(schemaRootNode);
          this.graph.addEdge(schemaRootNodeId, nodeId);
        }
        this.mergeSchema(schemaRootNode, valueShape);
      }
    }
  }

  private mergeSchema(parentNode: ApiSchemaRootNode, list: IFlattenedJsValueItem[]) {
    const nodesByPath: Map<string, ApiSchemaRelatedNode> = new Map();
    let currentParent: ApiSchemaRelatedNode = parentNode;
    for (const item of list) {

      if (item.parentPath !== null) {
        currentParent = nodesByPath.get(item.parentPath);
      }

      let node: ApiSchemaRelatedNode;
      let nodeId: NodeId;
      let currentParentId = this.graph.idFromHash(currentParent);

      const isParentAnObject = currentParent instanceof ApiSchemaParentNode && currentParent.jsonSchemaType === 'object';

      if (isParentAnObject) {
        const propertyNode = new ApiObjectPropertyNode(currentParent.hashCode(), item.key);
        const propertyNodeId = this.graph.tryAddNode(propertyNode);
        if (propertyNodeId) {
          this.graph.addEdge(propertyNodeId, currentParentId);
        }
        currentParent = propertyNode;
        currentParentId = this.graph.idFromHash(currentParent);
      }
      if (item.jsonSchemaType !== 'array' && item.jsonSchemaType !== 'object') {
        node = new ApiSchemaLeafNode(currentParent.hashCode(), item.jsonSchemaType);
        nodeId = this.graph.tryAddNode(node);
        if (nodeId) {
          this.graph.addEdge(nodeId, currentParentId);
        }
      } else {
        node = new ApiSchemaParentNode(currentParent.hashCode(), item.jsonSchemaType);
        nodeId = this.graph.tryAddNode(node);
        if (nodeId) {
          this.graph.addEdge(nodeId, currentParentId);
        }
      }
      nodesByPath.set(item.path, node);
    }
  }
}

export type ApiSchemaRelatedNode = ApiSchemaRootNode | ApiSchemaParentNode | ApiObjectPropertyNode | ApiSchemaLeafNode

export {
  ObservationsToGraph,
};
