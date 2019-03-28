const { Graph } = require('../graph');
const { GraphQueries } = require('../graph-queries');

describe('GraphQueries', function() {
  const graph = new Graph();
  const a = graph.addNode({
    type: 'ttt-aaa', hashCode() {
      return 'hhh-aaa';
    },
  });
  const b = graph.addNode({
    type: 'ttt-bbb', hashCode() {
      return 'hhh-bbb';
    },
  });
  const c = graph.addNode({
    type: 'ttt-ccc', hashCode() {
      return 'hhh-ccc';
    },
  });
  graph.addEdge(b, a);
  graph.addEdge(c, b);
  const graphQueries = new GraphQueries(graph);

  describe('children', function() {
    it('should list children', function() {
      expect(graphQueries.node(a).children().map(x => x.node.id)).toEqual([b]);
      expect(graphQueries.node(b).children().map(x => x.node.id)).toEqual([c]);
      expect(graphQueries.node(c).children().map(x => x.node.id)).toEqual([]);
    });
  });

  describe('parent', function() {
    it('should should yield parent', function() {
      expect(() => graphQueries.node(a).parent()).toThrow();
      expect(graphQueries.node(b).parent().node.id).toEqual(a);
      expect(graphQueries.node(c).parent().node.id).toEqual(b);
    });
  });

  describe('descendants', function() {
    it('should list descendants', function() {
      expect(graphQueries.node(a).descendants().map(x => x.node.id)).toEqual([b, c]);
      expect(graphQueries.node(b).descendants().map(x => x.node.id)).toEqual([c]);
      expect(graphQueries.node(c).descendants().map(x => x.node.id)).toEqual([]);
    });
  });
});
