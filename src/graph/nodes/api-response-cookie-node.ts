import { NodeHash } from '../graph';
import { BaseNode } from './base-node';

class ApiResponseCookieNode extends BaseNode {
  public readonly type: string = 'responseCookie';
  public readonly parentNodeHash: NodeHash;
  public readonly name: string;

  constructor(parentNodeHash: NodeHash, name: string) {
    super();
    this.parentNodeHash = parentNodeHash;
    this.name = name;
  }
}

export {
  ApiResponseCookieNode,
};
                  
