import * as shortHash from 'short-hash';
import { IBaseGraphNode } from './graph';

export function hash(node: IBaseGraphNode) {
  return shortHash(node.toHashString());
}
