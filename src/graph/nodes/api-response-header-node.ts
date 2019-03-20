import { NodeHash } from '../graph';
import { BaseNode } from './base-node';

class ApiResponseHeaderNode extends BaseNode {
  public readonly type: string = 'responseHeader';
  public readonly parentNodeHash: NodeHash;
  public readonly name: string;

  constructor(parentNodeHash: NodeHash, name: string) {
    super();
    this.parentNodeHash = parentNodeHash;
    this.name = name;
  }
}

export {
  ApiResponseHeaderNode,
};
                  
