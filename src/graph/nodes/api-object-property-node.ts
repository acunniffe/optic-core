import { NodeHash } from '../graph';
import { BaseNode } from './base-node';

class ApiObjectPropertyNode extends BaseNode {
  public readonly type: string = 'objectProperty';
  public readonly parentNodeHash: NodeHash;
  public readonly name: string;

  constructor(parentNodeHash: NodeHash, name: string) {
    super();
    this.parentNodeHash = parentNodeHash;
    this.name = name;
  }
}

export {
  ApiObjectPropertyNode,
};
                  
