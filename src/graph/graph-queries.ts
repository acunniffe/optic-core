import { Graph, Node, NodeId, NodeType, rootNodeId } from './graph';

class GraphQueries {
  public readonly graph: Graph;

  constructor(graph: Graph) {
    this.graph = graph;
  }

  public listNodesByType(type: NodeType) {
    return [...this.graph.nodes.values()]
      .filter((node: Node) => node.type === type)
      .map((node: Node) => new NodeQueries(this, node));
  }

  public root() {
    return this.node(rootNodeId);
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
  private graphQueries: GraphQueries;

  constructor(graphQueries: GraphQueries, node: Node) {
    this.graphQueries = graphQueries;
    this.node = node;
  }

  public isA(type: string) {
    return this.node.type === type;
  }

  public isChildOf(parentId: NodeId) {
    const outgoingEdges = this.graphQueries.graph.outgoingEdges.get(this.node.id);

    return outgoingEdges && outgoingEdges.has(parentId);
  }

  public parent() {
    const parentNodeIds = (this.graphQueries.graph.outgoingEdges.get(this.node.id) || new Map()).keys();
    const [parentNodeId] = parentNodeIds;

    return this.graphQueries.node(parentNodeId);
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

    if (!new Set(['schemaRoot', 'schemaParent', 'schemaLeaf']).has(this.node.type)) {
      throw new Error(`unexpected node in traversal ${this.node.type}`);
    }
    //@ts-ignore
    const jsonSchemaType: string = this.node.data.jsonSchemaType;
    if (this.node.type === 'schemaLeaf') {
      return {
        type: jsonSchemaType,
      };
    }

    if (this.node.type === 'schemaParent') {
      if (jsonSchemaType === 'object') {
        const properties = this.children()
          .reduce((acc: object, child: NodeQueries) => {
            //@ts-ignore
            const name: string = child.node.data.name;
            acc[name] = child.getMergedChildType();

            return acc;
          }, {});

        return {
          type: jsonSchemaType,
          properties,
        };
      } else if (jsonSchemaType === 'array') {
        return {
          type: jsonSchemaType,
          items: this.getMergedChildType(),
        };
      }
    }

    if (this.node.type === 'schemaRoot') {
      return this.getMergedChildType();
    }

    throw new Error('should not get here');
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

export {
  GraphQueries,
  NodeQueries,
};
