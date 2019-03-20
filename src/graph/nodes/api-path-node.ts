
import { BaseNode } from './base-node';

class ApiPathNode extends BaseNode {
  public readonly type: string = 'path';
  public readonly path: string;

  constructor(path: string) {
    super();
    this.path = path;
  }
}

export {
 ApiPathNode
}
                  
