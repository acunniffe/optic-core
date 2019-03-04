import { Token } from 'path-to-regexp';
import * as pathToRegexp from 'path-to-regexp';
import * as changeCase from 'change-case';
import * as changeCount from 'pluralize';

//@TODO: if POST to a plural name, resourceName should be singular
export function methodAndPathToName(method: string, path: string) {
  const resourceComponents = [];
  const qualifierComponents = [];
  const pathComponents = pathToRegexp.parse(path);
  const lastIndex = pathComponents.length - 1;

  pathComponents
    .forEach(function(component: Token, index: number) {
      if (typeof component === 'string') {
        if (index !== lastIndex && typeof pathComponents[index + 1] !== 'string') {
          resourceComponents.push(changeCount.singular(component));
        } else {
          resourceComponents.push(component);
        }
      } else {
        qualifierComponents.push(component.name);
      }
    });

  let subresourceName = '';
  if (resourceComponents.length > 0) {
    subresourceName = resourceComponents.map(x => changeCase.pascal(x)).join('');
  }
  let qualifierName = '';
  if (qualifierComponents.length > 0) {
    qualifierName = `By${qualifierComponents.map(x => changeCase.pascal(x)).join('And')}`;
  }
  const requestMethod = changeCase.lower(method);
  if (requestMethod === 'post') {
    subresourceName = changeCount.singular(subresourceName);
  }
  const requestName = `${requestMethod}${subresourceName}${qualifierName}`;
  const resourceName = changeCase.camelCase(subresourceName);

  return {
    requestName,
    resourceName,
  };
}

