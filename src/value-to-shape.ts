import * as deepdash from 'deepdash';
import * as lodash from 'lodash';
import { stringType } from './string-type';

const _ = deepdash(lodash);

export interface IFlattenedJsValueItem {
  key: string
  path: string
  parentPath: string | null
  jsonSchemaType: string
  depth: number
}

export function flattenJavascriptValueToList(x: any): IFlattenedJsValueItem[] {
  const list: IFlattenedJsValueItem[] = [
    { key: '', parentPath: null, path: '', depth: 0, jsonSchemaType: jsonSchemaTypeString(x) },
  ];

  _.eachDeep(x, (value: any, key: string, path: string, depth: number, _parent: any, _parentKey: string, parentPath: string) => {
    list.push({
      key, path, depth: depth + 1, parentPath, jsonSchemaType: jsonSchemaTypeString(value),
    });
  });


  return list;
}

export function jsonSchemaTypeString(value: any) {
  return stringType(value).toLowerCase();
}
