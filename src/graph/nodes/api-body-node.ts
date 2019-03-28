import { NodeHash } from '../graph';
import { BaseNode } from './base-node';

class ApiBodyNode extends BaseNode {
  public readonly type: string = 'body';
  public readonly parentNodeHash: NodeHash;
  public readonly contentType: string;

  constructor(parentNodeHash: NodeHash, contentType: string) {
    super();
    this.parentNodeHash = parentNodeHash;
    this.contentType = contentType;
  }
}

export {
  ApiBodyNode,
};
                  
