type ContextValueType = any;

export interface IReactContext {
  _currentValue: ContextValueType
  _defaultValue: ContextValueType
}

export interface IReactContextContainer {
  _context: IReactContext
}

export interface IReactContextProviderProps {
  value: ContextValueType
}

export interface IReactContextProvider {
  type: IReactContextContainer
  props: IReactContextProviderProps
}

export interface IReactContextConsumer {
  type: IReactContextContainer
}

class ContextStack {
  private readonly valueHistory: ContextValueType[] = [];
  private cursor: number = -1;

  public enterContext(provider: IReactContextProvider) {
    this.cursor += 1;
    const { value } = provider.props;
    const context = provider.type._context;

    this.valueHistory[this.cursor] = context._currentValue;
    context._currentValue = value;
  }

  //@instead of having the provider be passed in, we can maintain a stack of context
  public exitContext(provider: IReactContextProvider) {
    const context = provider.type._context;
    const previousValue = this.valueHistory[this.cursor];
    context._currentValue = previousValue;
    this.clearHistory(this.cursor);
    this.cursor -= 1;
  }

  public getCurrentValue(consumer: IReactContextConsumer) {
    return consumer.type._context._currentValue;
  }

  private clearHistory(cursor: number) {
    this.valueHistory[cursor] = null;
  }
}

export {
  ContextStack,
};
