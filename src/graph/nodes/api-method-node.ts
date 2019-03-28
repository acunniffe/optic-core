
import { BaseNode } from './base-node';

class ApiMethodNode extends BaseNode {
  public readonly type: string = 'method';
  public readonly path: string;
  public readonly method: string;

  constructor(path: string, method: string) {
    super();
    this.path = path;
    this.method = method;
  }
}

export {
 ApiMethodNode
}
                  
