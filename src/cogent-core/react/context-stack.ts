type ContextValueType = any;

interface IReactContext {
  _currentValue: ContextValueType
  _defaultValue: ContextValueType
}

interface IReactContextContainer {
  _context: IReactContext
}

interface IReactContextProviderProps {
  value: ContextValueType
}

interface IReactContextProvider {
  type: IReactContextContainer
  props: IReactContextProviderProps
}

interface IReactContextConsumer {
  type: IReactContextContainer
}

class ContextStack {
  private readonly valueHistory: ContextValueType[] = [];
  private cursor: number = -1;

  public enterContext(provider: IReactContextProvider) {
    console.log(`entered ${provider.props.value} (previously ${provider.type._context._currentValue})`);
    this.cursor += 1;
    const { value } = provider.props;
    const context = provider.type._context;

    this.valueHistory[this.cursor] = context._currentValue;
    context._currentValue = value;
  }

  //@alternatively, we can maintain a stack of context
  public exitContext(provider: IReactContextProvider) {
    console.log(`exited ${provider.props.value} (restoring to ${this.valueHistory[this.cursor]})`);
    const context = provider.type._context;
    const previousValue = this.valueHistory[this.cursor];
    context._currentValue = previousValue;
    this.clearHistory(this.cursor);
    this.cursor -= 1;
  }

  public getCurrentValue(consumer: IReactContextConsumer) {
    console.log(`inspecting context for ${consumer.type._context._currentValue}`);
    return consumer.type._context._currentValue;
  }

  private clearHistory(cursor: number) {
    this.valueHistory[cursor] = null;
  }
}

export {
  ContextStack,
};
