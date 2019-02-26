/*
https://www.typescriptlang.org/docs/handbook/jsx.html
namespace JSX {

  interface IntrinsicElements {
    file: any
    folder: any
  }
}
*/
import * as React from 'react';

type FileName = string
type FolderName = string
type PathName = string

//@TODO add postprocessors like formatting and linting, might need to be an intrinsic element around files/folders
interface IFileSystemRendererFile {
  name: FileName
  path: PathName
  contents: string[]
}

interface IFileSystemRendererFolder {
  name: FolderName
  path: PathName
  files: { [path: string]: IFileSystemRendererFile }
  folders: { [path: string]: IFileSystemRendererFolder }
}

//@TODO this should be a stack
const contextStack = [];

//@TODO: instead, use react-is/src/ReactIs.js
function evaluateTree(root: JSX.Element) {
  if (root === null) {
    return null;
  }


  if (typeof root.type === 'function') {
    return evaluateTree(root.type(root.props));
  }

  if (root.type === Symbol.for('react.fragment')) {
    throw new Error(`React.Fragment is currently not supported`);
  }

  if (root.type) {
    if (root.type.$$typeof === Symbol.for('react.provider')) {
      //console.log(require('util').inspect(root, { colors: true, depth: 10 }));
      contextMap.set(root.type._context.Provider, root.props.value);

      //@TODO this is not guaranteed to work everywhere; need to support a fragment-like concept

      return evaluateTree(<source>{root.props.children}</source>);
    } else if (root.type.$$typeof === Symbol.for('react.context')) {
      //console.log(require('util').inspect(root, { colors: true, depth: 10 }));

      const contextValue = contextMap.get(root.type._context.Provider);
      return evaluateTree(root.props.children(contextValue));
    }
  }

  return root;
}

function renderSync(component: JSX.Element, options, callback) {
  const rootNode = evaluateTree(component);
  const rootFolder = {
    name: '',
    path: '',
    files: {},
    folders: {},
  };
  try {
    renderSyncHelper(rootNode, options, rootFolder);
    callback(null, rootFolder);
  } catch (e) {
    callback(e);
  }
}

function renderSyncFileHelper(file: IFileSystemRendererFile, child: JSX.Element) {
  React.Children.forEach(child.props.children, (c: JSX.Element) => {
    const nestedChild = evaluateTree(c);
    if (nestedChild === null) {
      return;
    }

    if (typeof nestedChild === 'string') {
      file.contents.push(nestedChild);
    } else if (nestedChild.type === 'line') {
      renderSyncFileHelper(file, nestedChild);
      file.contents.push('\n');
    } else if (nestedChild.type === 'source') {
      renderSyncFileHelper(file, nestedChild);
    } else {
      console.warn(`<file> should only have string or <source> children`, file, nestedChild);
    }
  });
}

function stringify(folder: IFileSystemRendererFolder) {
  Object.keys(folder.folders)
    .forEach((folderName: string) => {
      const f = folder.folders[folderName];
      stringify(f);
    });
  Object.keys(folder.files)
    .forEach((fileName: string) => {
      const file = folder.files[fileName];
      console.log(`${file.path}:\n==\n${file.contents.join('')}\n==\n`);
    });
}

function renderSyncHelper(node: JSX.Element, options, parentFolder: IFileSystemRendererFolder) {
  if (node.type === 'folder') {
    const { name, children } = node.props;
    if (parentFolder.folders[name]) {
      throw new Error(`cannot overwrite output folder ${name} in ${parentFolder.path}`);
    }
    const folder = {
      name,
      path: `${parentFolder.path}/${name}`,
      files: {},
      folders: {},
    };
    parentFolder.folders[name] = folder;
    React.Children.forEach(children, (c: JSX.Element) => {
      const child = evaluateTree(c);
      if (child.type === 'file' || child.type === 'folder') {
        renderSyncHelper(child, options, folder);
      } else {
        console.warn('<folder> should only have <file> or <folder> children', child);
      }
    });
  } else if (node.type === 'file') {
    const { name, children } = node.props;
    if (parentFolder.files[name]) {
      throw new Error(`cannot overwrite output file ${name} in ${parentFolder.path}`);
    }
    const file = {
      name,
      path: `${parentFolder.path}/${name}`,
      contents: [],
    };
    parentFolder.files[name] = file;
    React.Children.forEach(children, (c: JSX.Element) => {
      const child = evaluateTree(c);
      if (child.type === 'source') {
        renderSyncFileHelper(file, child);
      } else {
        console.warn('<file> should only have <source> children', child);
      }
    });
  } else {
    console.warn(`unexpected element`, node, parentFolder);
  }
}

export {
  renderSync,
  stringify,
};
