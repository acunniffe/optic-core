import { ObservationsToGraphBuilder } from '../observations-to-graph';
import { pathObservations, singleRequestBody, singleResponseBody } from './optic-observations.fixture.js';
import { InteractionsToDiff } from '../interactions-to-diff';

describe('Interactions to Diff', function() {
  const baseObservations = [
    ...pathObservations,
    ...singleRequestBody({ key1: 'stringValue' }),
    ...singleResponseBody(['a']),
  ];

  let baseApiGraph;
  beforeEach(() => {
    const observationsToGraph = ObservationsToGraphBuilder.fromEmptyGraph();
    observationsToGraph.interpretObservations(baseObservations);
    baseApiGraph = observationsToGraph.graph;
  });

  describe('no interactions', function() {

    let diff;
    beforeEach(function() {
      const interactionsToDiff = new InteractionsToDiff(baseApiGraph);
      interactionsToDiff.observeInteractions([], { pathMatcherList: [] });
      diff = interactionsToDiff.getDiff();
    });

    it('should have no covered nodes', function() {
      expect(diff.coveredNodeIds.size).toBe(0);
    });
    it('should have all uncovered nodes', function() {
      expect(diff.uncoveredNodeIds.size).toBe(15);
    });
    it('should have no new nodes', function() {
      expect(diff.newNodeIds.size).toBe(0);
    });
  });

  describe('interactions with additional observations', function() {
    let diff;
    beforeEach(function() {
      const interactionsToDiff = new InteractionsToDiff(baseApiGraph);
      interactionsToDiff.interpretObservations([
        ...pathObservations,
        ...singleRequestBody({ key1: 'stillAStringValue', key2: 'newStringValue' }),
        ...singleResponseBody(['a']),
      ]);
      diff = interactionsToDiff.getDiff();
    });

    it('should cover all nodes', function() {
      expect(diff.coveredNodeIds.size).toBe(15);
    });
    it('should have no uncovered nodes', function() {
      expect(diff.uncoveredNodeIds.size).toBe(0);
    });
    it('should have new data nodes', function() {
      expect(diff.newNodeIds.size).toBe(2);
    });
  });

  describe('interactions missing observations', function() {
    let diff;
    beforeEach(function() {
      const interactionsToDiff = new InteractionsToDiff(baseApiGraph);
      interactionsToDiff.interpretObservations([
        ...pathObservations,
      ]);
      diff = interactionsToDiff.getDiff();
    });

    it('should not cover all nodes', function() {
      expect(diff.coveredNodeIds.size).toBe(6);
    });
    it('should have uncovered data nodes', function() {
      expect(diff.uncoveredNodeIds.size).toBe(9);
    });
    it('should have no new data nodes', function() {
      expect(diff.newNodeIds.size).toBe(0);
    });
  });
});
