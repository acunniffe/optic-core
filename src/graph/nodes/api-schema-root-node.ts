import { NodeHash } from '../graph';
import { BaseNode } from './base-node';

class ApiSchemaRootNode extends BaseNode {
  public readonly type: string = 'schemaRoot';
  public readonly parentNodeHash: NodeHash;

  constructor(parentNodeHash: NodeHash) {
    super();
    this.parentNodeHash = parentNodeHash;
  }
}

export {
  ApiSchemaRootNode,
};
                  
