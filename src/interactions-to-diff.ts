import { IApiInteraction } from './common';
import { DiffingGraph } from './diffing-graph';
import { Graph } from './graph/graph';
import { InteractionsToObservations, IObserverConfig, Observation } from './interactions-to-observations';
import { ObservationsToGraphBuilder } from './observations-to-graph';

class InteractionsToDiff {
  private readonly graph: DiffingGraph;

  constructor(referenceApiGraph: Graph) {
    const diffingGraph = new DiffingGraph(referenceApiGraph);
    this.graph = diffingGraph;
  }

  public observeInteractions(interactions: IApiInteraction[], config: IObserverConfig) {
    const observations = InteractionsToObservations.getObservations(interactions, config);
    this.interpretObservations(observations);
  }

  public interpretObservations(observations: Observation[]) {
    const observationsToGraph = ObservationsToGraphBuilder.fromExistingGraph(this.graph);
    observationsToGraph.interpretObservations(observations);
  }

  public getDiff() {
    return {
      graph: this.graph,
      uncoveredNodeIds: this.graph.uncoveredNodeIds,
      coveredNodeIds: this.graph.coveredNodeIds,
      newNodeIds: this.graph.newNodeIds,
    };
  }
}

export {
  InteractionsToDiff,
};
