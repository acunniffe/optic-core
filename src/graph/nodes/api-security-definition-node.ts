import { ISecurityConfig } from '../../session-manager';
import { BaseNode } from './base-node';

class ApiSecurityDefinitionNode extends BaseNode {
  public readonly type: string = 'securityDefinition';
  public readonly security: ISecurityConfig;

  constructor(security: ISecurityConfig) {
    super();
    this.security = security;
  }
}

export {
  ApiSecurityDefinitionNode,
};
                  
