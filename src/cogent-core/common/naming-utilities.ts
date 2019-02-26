import * as pathToRegexp from 'path-to-regexp';
import * as changeCase from 'change-case';
import * as changeCount from 'pluralize';

export function methodAndPathToName(method: string, path: string) {
  const resourceComponents = [];
  const qualifierComponents = [];
  const pathComponents = pathToRegexp.parse(path);
  const lastIndex = pathComponents.length - 1;

  pathComponents.forEach(function(component, index) {
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

  let subresourceString = '';
  if (resourceComponents.length > 0) {
    subresourceString = resourceComponents.map(x => changeCase.pascal(x)).join('');
  }
  let qualifierString = '';
  if (qualifierComponents.length > 0) {
    qualifierString = `By${qualifierComponents.map(x => changeCase.pascal(x)).join('And')}`;
  }

  return `${changeCase.lower(method)}${subresourceString}${qualifierString}`;
}

