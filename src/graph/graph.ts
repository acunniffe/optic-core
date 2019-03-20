import { idGeneratorFactory } from '../logging-server';

export type NodeId = string;
export type NodeHash = string;
export type EdgeId = string;
export type NodeType = string;
export type NodeData = IGraphNode;
export type Node = {
  id: NodeId
  value: NodeData
};

export interface IBaseGraphNode {
  hashCode(): NodeHash

  toHashString(): string

  toGraphViz(): string
}

export interface IGraphNode extends IBaseGraphNode {
  type: NodeType
}

class Graph {
  public readonly nodes: Map<NodeId, Node>;
  public readonly outgoingEdges: Map<NodeId, Map<NodeId, Set<EdgeId>>>;
  public readonly incomingEdges: Map<NodeId, Map<NodeId, Set<EdgeId>>>;
  private edgeIdGenerator: IterableIterator<number>;
  private nodeIdGenerator: IterableIterator<number>;
  private nodesHashes: Map<NodeHash, Node>;

  constructor() {
    this.nodes = new Map();
    this.nodesHashes = new Map();
    this.outgoingEdges = new Map();
    this.incomingEdges = new Map();
    this.edgeIdGenerator = idGeneratorFactory();
    this.nodeIdGenerator = idGeneratorFactory();
  }

  public addNode(node: IGraphNode) {
    const id: NodeId = this.nodeIdGenerator.next().value.toString();

    if (this.nodes.has(id)) {
      throw new Error(`graph already has node with id ${id}`);
    }
    const hash = node.hashCode();
    if (this.nodesHashes.has(hash)) {
      throw new Error(`graph already has node with hash ${hash}`);
    }

    this.unsafeAddNode(id, node);

    return id;
  }

  public tryAddNode(node: IGraphNode) {
    const id: NodeId = this.nodeIdGenerator.next().value.toString();
    if (this.nodes.has(id)) {
      return null;
    }

    const hash = node.hashCode();
    if (this.nodesHashes.has(hash)) {
      return null;
    }

    this.unsafeAddNode(id, node);

    return id;
  }

  //@TODO move this to a separate class?
  public idFromHash(node: IGraphNode) {
    const hash = node.hashCode();
    if (this.nodesHashes.has(hash)) {
      return this.nodesHashes.get(hash).id;
    }
    throw new Error(`graph does not have a node with hash ${hash}`);
  }

  private unsafeAddNode(id: NodeId, value: IGraphNode) {
    const node = { id, value };
    this.nodes.set(id, node);
    this.nodesHashes.set(value.hashCode(), node);
  }

  public addEdge(sourceNodeId: NodeId, destinationNodeId: NodeId) {
    if (sourceNodeId === destinationNodeId) {
      throw new Error(`can't add an edge from node ${sourceNodeId} to itself`);
    }
    if (!this.nodes.has(sourceNodeId)) {
      throw new Error(`source node ${sourceNodeId} must exist`);
    }
    if (!this.nodes.has(destinationNodeId)) {
      throw new Error(`destination node ${destinationNodeId} must exist`);
    }

    const id: EdgeId = this.edgeIdGenerator.next().value.toString();
    const edgesFromDestination = this.incomingEdges.get(destinationNodeId) || new Map<NodeId, Set<EdgeId>>();
    const edgesFromDestinationToSource = edgesFromDestination.get(sourceNodeId) || new Set();
    edgesFromDestinationToSource.add(id);
    edgesFromDestination.set(sourceNodeId, edgesFromDestinationToSource);
    this.incomingEdges.set(destinationNodeId, edgesFromDestination);

    const edgesFromSource = this.outgoingEdges.get(sourceNodeId) || new Map<NodeId, Set<EdgeId>>();
    const edgesFromSourceToDestination = edgesFromSource.get(destinationNodeId) || new Set();
    edgesFromSourceToDestination.add(id);
    edgesFromSource.set(destinationNodeId, edgesFromSourceToDestination);
    this.outgoingEdges.set(sourceNodeId, edgesFromSource);

    return id;
  }

  public ensureEdgeExistsBetween(sourceNodeId: NodeId, destinationNodeId: NodeId) {
    const edgesFromSource = this.outgoingEdges.get(sourceNodeId);
    if (!edgesFromSource) {
      this.addEdge(sourceNodeId, destinationNodeId);
    } else {
      if (!edgesFromSource.has(destinationNodeId)) {
        this.addEdge(sourceNodeId, destinationNodeId);
      }
    }
  }

  public toGraphViz() {
    const output = [];
    for (const [nodeId, node] of this.nodes.entries()) {
      output.push(`"${nodeId}" [label="${node.value.toGraphViz()}"]`);
    }
    for (const [sourceNodeId, destinationNodeIds] of this.outgoingEdges.entries()) {
      for (const destinationNodeId of destinationNodeIds.keys()) {
        output.push(`"${sourceNodeId}" -> "${destinationNodeId}"`);
      }
    }


    return `
digraph G {
rankdir=RL
${output.join('\n')}
}`;
  }
}

export {
  Graph,
};
