import { ApiPathNode } from '../api-path-node';

describe('API Path Node', function() {
  describe('hash', function() {
    it('should have a hash using the path', function() {
      const node1 = new ApiPathNode('p1');
      const node2 = new ApiPathNode('p2');
      const node3 = new ApiPathNode('p1');
      expect(node1.hashCode()).not.toEqual(node2.hashCode());
      expect(node3.hashCode()).not.toEqual(node2.hashCode());
      expect(node1.hashCode()).toEqual(node3.hashCode());
    });
  });
});
