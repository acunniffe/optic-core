//@HINT: to visualize stuff, do something like require('fs').writeFileSync('output.graphviz.txt', observationsToGraph.graph.toGraphViz());

const { GraphQueries } = require('../graph/graph-queries');

const { ObservationsToGraphBuilder } = require('../observations-to-graph');
const { pathObservations, singleRequestBody } = require('./optic-observations.fixture.js');
const {toMatchSnapshot} = require('jest-snapshot');
expect.extend({toMatchSnapshot});

describe('ObservationsToGraph', function() {
  describe('simple API', function() {
    const observationsToGraph = ObservationsToGraphBuilder.fromEmptyGraph()
    observationsToGraph.interpretObservations(pathObservations);

    it('should understand the request body format', function() {
      observationsToGraph.interpretObservations(singleRequestBody({
        'emails': [
          'test@optic.com',
          'test2@optic.com',
        ],
      }));
      const graphQueries = new GraphQueries(observationsToGraph.graph);
      const [schemaRootNode] = graphQueries.listNodesByType('schemaRoot');
      expect(schemaRootNode.toJsonSchema()).toMatchSnapshot()
    });

    it('should understand the request body format with different observations', function() {
      observationsToGraph.interpretObservations(singleRequestBody({
        'emails': [],
      }));
      observationsToGraph.interpretObservations(singleRequestBody([]));
      observationsToGraph.interpretObservations(singleRequestBody('abc'));
      observationsToGraph.interpretObservations(singleRequestBody({
        'emails': [
          'test@optic.com',
          'test2@optic.com',
        ],
      }));
      observationsToGraph.interpretObservations(singleRequestBody({
        'emails': [
          1,
          2,
        ],
      }));
      observationsToGraph.interpretObservations(singleRequestBody({
        'emails': [
          'test@optic.com',
        ],
      }));

      const graphQueries = new GraphQueries(observationsToGraph.graph);
      const [schemaRootNode] = graphQueries.listNodesByType('schemaRoot');
      expect(schemaRootNode.toJsonSchema()).toMatchSnapshot();
    });
  });
});
