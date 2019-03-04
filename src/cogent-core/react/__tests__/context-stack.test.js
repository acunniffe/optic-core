import { ContextStack } from '../context-stack';

describe('Context Stack', function() {
  describe('single provider', function() {
    it('should track the history of value changes', function() {
      function createContext(defaultValue) {
        const context = {
          _defaultValue: defaultValue,
          _currentValue: defaultValue,
        };
        const Provider = {
          type: {
            _context: context,
          },
          props: {},
        };
        const Consumer = {
          type: {
            _context: context,
          },
          getValue() {
            return context._currentValue;
          },
        };

        return { Provider, Consumer };
      }

      function override(provider, value) {
        provider.props.value = value;
      }

      const { Provider: providerA, Consumer: consumerA } = createContext('a');
      const { Provider: providerB, Consumer: consumerB } = createContext('b');

      expect(consumerA.getValue()).toEqual('a');
      expect(consumerB.getValue()).toEqual('b');

      const stack = new ContextStack();

      override(providerA, 'a1');
      stack.enterContext(providerA);
      expect(consumerA.getValue()).toEqual('a1');
      expect(consumerB.getValue()).toEqual('b');

      override(providerB, 'b1');
      stack.enterContext(providerB);
      expect(consumerA.getValue()).toEqual('a1');
      expect(consumerB.getValue()).toEqual('b1');

      override(providerB, 'b2');
      stack.enterContext(providerB);
      expect(consumerA.getValue()).toEqual('a1');
      expect(consumerB.getValue()).toEqual('b2');

      stack.exitContext(providerB);
      expect(consumerA.getValue()).toEqual('a1');
      expect(consumerB.getValue()).toEqual('b1');

      stack.exitContext(providerB);
      expect(consumerA.getValue()).toEqual('a1');
      expect(consumerB.getValue()).toEqual('b');

      stack.exitContext(providerA);
      expect(consumerA.getValue()).toEqual('a');
      expect(consumerB.getValue()).toEqual('b');
    });
  });
});
