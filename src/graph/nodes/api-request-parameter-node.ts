
import { BaseNode } from './base-node';

class ApiRequestParameterNode extends BaseNode {
  public readonly type: string = 'requestParameter';
  public readonly path: string;
  public readonly method: string;
  public readonly statusCode: number;
  public readonly source: string;
  public readonly name: string;

  constructor(path: string, method: string, statusCode: number, source: string, name: string) {
    super();
    this.path = path;
    this.method = method;
    this.statusCode = statusCode;
    this.source = source;
    this.name = name;
  }
}

export {
 ApiRequestParameterNode
}
                  
