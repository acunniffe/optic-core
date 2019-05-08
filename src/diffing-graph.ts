import { Graph, IGraphNode, NodeId } from './graph/graph';

class DiffingGraph extends Graph {
  public readonly uncoveredNodeIds: Set<NodeId>;
  public readonly coveredNodeIds: Set<NodeId>;
  public readonly newNodeIds: Set<NodeId>;

  constructor(baseGraph: Graph) {
    super();
    Object.assign(this, baseGraph);
    this.newNodeIds = new Set();
    this.uncoveredNodeIds = new Set(baseGraph.nodes.keys());
    this.coveredNodeIds = new Set();
  }

  public addNode(node: IGraphNode): string {
    const result = super.addNode(node);
    this.newNodeIds.add(result);

    return result;
  }

  public tryAddNode(node: IGraphNode): [NodeId, boolean] {
    const [result, added] = super.tryAddNode(node);
    if (added) {
      this.newNodeIds.add(result);
    } else {
      const nodeId = super.idFromHash(node);
      this.uncoveredNodeIds.delete(nodeId);
      this.coveredNodeIds.add(nodeId);
    }

    return [result, added];
  }
}

export {
  DiffingGraph,
};
