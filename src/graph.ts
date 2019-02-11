export type NodeId = string;
export type EdgeId = string;
export type NodeType = string;
export type NodeData = object;
export type Node = {
  id: NodeId
  type: NodeType
  data: NodeData
};

class Graph {
  private nodes: Map<NodeId, Node>;
  private edges: Map<NodeId, Map<NodeId, EdgeId[]>>;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  public addNode(id: NodeId, type: NodeType, data: NodeData) {
    if (this.nodes.has(id)) {
      throw new Error(`graph already has node with id ${id}`);
    }
    this.nodes.set(id, { id, type, data });
  }

  public addEdge(id: EdgeId, sourceNodeId: NodeId, destinationNodeId: NodeId) {
    const edgesFromSource = this.edges.get(sourceNodeId) || new Map<NodeId, EdgeId[]>();
    const edgesFromSourceToDestination = edgesFromSource.get(destinationNodeId) || [];
    edgesFromSourceToDestination.push(id);
    edgesFromSource.set(destinationNodeId, edgesFromSourceToDestination);
    this.edges.set(sourceNodeId, edgesFromSource);
  }
}

export {
  Graph,
};
