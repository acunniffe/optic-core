import { Graph, Node, NodeData, NodeId, NodeType } from './graph';
import { ApiObjectPropertyNode } from './nodes/api-object-property-node';
import { ApiSchemaLeafNode } from './nodes/api-schema-leaf-node';
import { ApiSchemaParentNode } from './nodes/api-schema-parent-node';
import { ApiSchemaRootNode } from './nodes/api-schema-root-node';

class GraphQueries {
  public readonly graph: Graph;

  constructor(graph: Graph) {
    this.graph = graph;
  }

  public listNodesByType(type: NodeType) {
    return [...this.graph.nodes.values()]
      .filter((node: Node) => node.value.type === type)
      .map((node: Node) => new NodeQueries(this, node));
  }

  public node(nodeId: NodeId) {
    if (!this.graph.nodes.has(nodeId)) {
      throw new Error(`graph does not have a node with id ${nodeId}`);
    }

    return new NodeQueries(this, this.graph.nodes.get(nodeId));
  }
}

class NodeQueries {
  public readonly node: Node;
  public readonly graphQueries: GraphQueries;

  constructor(graphQueries: GraphQueries, node: Node) {
    this.graphQueries = graphQueries;
    this.node = node;
  }

  public isA(type: string) {
    return this.node.value.type === type;
  }

  public isChildOf(parentId: NodeId) {
    const outgoingEdges = this.graphQueries.graph.outgoingEdges.get(this.node.id);

    return outgoingEdges && outgoingEdges.has(parentId);
  }

  public parent() {
    const [parentNodeId] = this.parentNodeIds();

    return this.graphQueries.node(parentNodeId);
  }

  public parentNodeIds() {
    const parentNodeIds = (this.graphQueries.graph.outgoingEdges.get(this.node.id) || new Map()).keys();
    return parentNodeIds;
  }

  public hasParent() {
    const parentNodeIds = this.parentNodeIds();

    return [...parentNodeIds].length > 0;
  }

  //@GOTCHA: this includes the current node as a sibling of itself
  public siblingsAndSelf() {
    const [parentNodeId] = this.parentNodeIds();
    if (!parentNodeId) {
      return [];
    }

    return this.graphQueries.node(parentNodeId).children();
  }

  public children() {
    const incomingEdges = this.graphQueries.graph.incomingEdges;
    const childNodeIds = (incomingEdges.get(this.node.id) || new Map()).keys();

    return [...childNodeIds].map((nodeId: NodeId) => {
      return this.graphQueries.node(nodeId);
    });
  }

  public descendants(seenSet: Set<NodeId> = new Set()) {
    const descendants = [];
    for (const child of this.children()) {
      if (!seenSet.has(child.node.id)) {
        seenSet.add(child.node.id);
        descendants.push(child, ...child.descendants(seenSet));
      }
    }

    return descendants;
  }

  public toJsonSchema() {

    if (isSchemaRootNode(this.node.value)) {
      return this.getMergedChildType();
    }

    if (isSchemaLeafNode(this.node.value)) {
      const {jsonSchemaType}= this.node.value;

      return {
        type: jsonSchemaType,
        title: this.node.value.hashCode()
      };
    }

    if (isSchemaParentNode(this.node.value)) {
      const {jsonSchemaType}= this.node.value;
      if (jsonSchemaType === 'object') {
        const properties = this.children()
          .reduce((acc: object, child: NodeQueries) => {
            const name: string = (child.node.value as ApiObjectPropertyNode).name;
            acc[name] = child.getMergedChildType();

            return acc;
          }, {});

        return {
          type: jsonSchemaType,
          title: this.node.value.hashCode(),
          properties,
        };
      } else if (jsonSchemaType === 'array') {
        return {
          type: jsonSchemaType,
          title: this.node.value.hashCode(),
          items: this.getMergedChildType(),
        };
      }
    }
    throw new Error(`unexpected node in traversal ${this.node.value.type}`);
  }

  private getMergedChildType() {
    const children = this.children();
    if (children.length === 0) {
      return {};
    } else if (children.length === 1) {
      return children[0].toJsonSchema();
    } else {
      return {
        oneOf: this.children().map((child: NodeQueries) => child.toJsonSchema()),
      };
    }
  }
}

function isSchemaRootNode(value: NodeData): value is ApiSchemaRootNode {
  return value.type === 'schemaRoot';
}

function isSchemaLeafNode(value: NodeData): value is ApiSchemaLeafNode {
  return value.type === 'schemaLeaf';
}

function isSchemaParentNode(value: NodeData): value is ApiSchemaParentNode {
  return value.type === 'schemaParent';
}

export {
  GraphQueries,
  NodeQueries,
};
