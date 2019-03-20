import { IBaseGraphNode } from '../graph';
import { hash } from '../graph-node-hasher';

class BaseNode implements IBaseGraphNode {
  [x: string]: any;

  public hashCode() {
    return hash(this);
  }

  public toHashString() {
    return JSON.stringify(this);
  }

  public toGraphViz() {
    return this.type ? this.type : '?';
  }
}

export {
  BaseNode,
};
