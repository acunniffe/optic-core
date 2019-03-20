import { NodeHash } from '../graph';
import { BaseNode } from './base-node';

class ApiSchemaParentNode extends BaseNode {
  public readonly type: string = 'schemaParent';
  public readonly parentNodeHash: NodeHash;
  public readonly jsonSchemaType: string;

  constructor(parentNodeHash: NodeHash, jsonSchemaType: string) {
    super();
    this.parentNodeHash = parentNodeHash;
    this.jsonSchemaType = jsonSchemaType;
  }
}

export {
  ApiSchemaParentNode,
};
                  
