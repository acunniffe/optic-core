import { idGeneratorFactory } from './logging-server';

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
  private edges: Map<NodeId, Map<NodeId, Set<EdgeId>>>;
  private edgeIdGenerator: IterableIterator<number>;
  private nodeIdGenerator: IterableIterator<number>;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.edgeIdGenerator = idGeneratorFactory();
    this.nodeIdGenerator = idGeneratorFactory();
  }

  public addNode(id: NodeId, type: NodeType, data: NodeData) {
    if (this.nodes.has(id)) {
      throw new Error(`graph already has node with id ${id}`);
    }
    this.unsafeAddNode(id, type, data);

    return id;
  }

  public tryAddNode(id: NodeId, type: NodeType, data: NodeData) {
    if (this.nodes.has(id)) {
      return false;
    }

    this.unsafeAddNode(id, type, data);

    return true;
  }

  public addNodeWithDynamicId(type: NodeType, data: NodeData) {
    const id: NodeId = this.nodeIdGenerator.next().value.toString();

    return this.addNode(id, type, data);
  }

  private unsafeAddNode(id: NodeId, type: NodeType, data: NodeData) {
    this.nodes.set(id, { id, type, data });
  }

  public addEdge(sourceNodeId: NodeId, destinationNodeId: NodeId) {
    const id: EdgeId = this.edgeIdGenerator.next().value.toString();
    const edgesFromSource = this.edges.get(sourceNodeId) || new Map<NodeId, Set<EdgeId>>();
    const edgesFromSourceToDestination = edgesFromSource.get(destinationNodeId) || new Set();
    edgesFromSourceToDestination.add(id);
    edgesFromSource.set(destinationNodeId, edgesFromSourceToDestination);
    this.edges.set(sourceNodeId, edgesFromSource);

    return id;
  }

  public ensureEdgeExistsBetween(sourceNodeId: NodeId, destinationNodeId: NodeId) {
    const edgesFromSource = this.edges.get(sourceNodeId);
    if (!edgesFromSource) {
      this.addEdge(sourceNodeId, destinationNodeId);
    } else {
      if (!edgesFromSource.has(destinationNodeId)) {
        this.addEdge(sourceNodeId, destinationNodeId);
      }
    }
  }


}

export {
  Graph,
};
