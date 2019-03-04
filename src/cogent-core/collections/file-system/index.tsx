import * as React from 'react';

//@TODO other things would be declarative file copying, potentially with interpolation/templating

function NestedFolder({ path, children }) {
  const splitPath = path.split('/');
  const nestedFolders = splitPath.reduceRight((acc: JSX.Element, pathComponent: string) => {
    return <folder name={pathComponent}>{acc}</folder>;
  }, children);

  return nestedFolders;
}

export {
  NestedFolder,
};
