
import { BaseNode } from './base-node';

class ApiResponseNode extends BaseNode {
  public readonly type: string = 'response';
  public readonly path: string;
  public readonly method: string;
  public readonly statusCode: number;

  constructor(path: string, method: string, statusCode: number) {
    super();
    this.path = path;
    this.method = method;
    this.statusCode = statusCode;
  }
}

export {
 ApiResponseNode
}
                  
