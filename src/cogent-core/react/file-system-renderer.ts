/*
@TODO expose types with Cogent Intrinsic Elements
https://www.typescriptlang.org/docs/handbook/jsx.html
namespace JSX {

  interface IntrinsicElements {
    file: any
    folder: any
  }
}
*/
import * as React from 'react';
import * as ReactIs from 'react-is';
import { ContextStack } from './context-stack';

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

class FileSystemRenderer {
  private readonly contextStack: ContextStack = new ContextStack();
  private readonly intrinsicElementTypes: Set<string> = new Set(['folder', 'file', 'source', 'line']);

  public renderSync(element: JSX.Element, options: any, callback) {
    try {
      const rootFolder = {
        name: '',
        path: '',
        files: {},
        folders: {},
      };
      const rootNodes = this.evaluateElement(element);
      rootNodes.forEach((rootNode) => {
        this.renderSyncHelper(rootNode, rootFolder);
      });

      callback(null, rootFolder);
    } catch (e) {
      callback(e);
    }
  }

  private renderSyncHelper(node: JSX.Element, parentFolder: IFileSystemRendererFolder) {
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
        const childNodes = this.evaluateElement(c);
        childNodes.forEach((child) => {
          if (child.type === 'file' || child.type === 'folder') {
            this.renderSyncHelper(child, folder);
          } else {
            console.warn('<folder> should only have <file> or <folder> children', child);
          }
        });
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
        const childNodes = this.evaluateElement(c);
        childNodes.forEach((child) => {
          if (child.type === 'source') {
            this.appendToFile(child, file);
          } else {
            console.warn('<file> should only have <source> children', child);
          }
        });
      });
    } else {
      console.warn(`unexpected element`, node, parentFolder);
    }
  }

  private appendToFile(element: JSX.Element, file: IFileSystemRendererFile) {
    React.Children.forEach(element.props.children, (c: JSX.Element) => {
      const childNodes = this.evaluateElement(c);
      childNodes.forEach((child) => {
        if (typeof child === 'string') {
          file.contents.push(child);
        } else if (child.type === 'line') {
          this.appendToFile(child, file);
          file.contents.push('\n');
        } else if (child.type === 'source') {
          this.appendToFile(child, file);
        } else {
          console.warn(`<file> should only have string or <line> or <source> children`, { file });
          console.log(require('util').inspect(child, { colors: true, depth: 10, compact: false }));
        }
      });

    });
  }

  private isIntrinsicType(element: JSX.Element) {
    return this.intrinsicElementTypes.has(element.type);
  }

  private evaluateElements(elements: JSX.Element[]) {
    return elements
      .map((element) => this.evaluateElement(element))
      .reduce((acc, values) => [...acc, ...values], []);
  }

  private evaluateElement(element: JSX.Element) {
    if (element === null || element === undefined) {
      console.warn('got null or undefined');
      return [];
    }

    if (typeof element === 'string') {
      return [element];
    }

    if (!ReactIs.isValidElementType(element.type)) {
      console.warn('invalid element type');
      console.log(element);
      return [];
    }

    if (this.isIntrinsicType(element)) {
      return [element];
    }


    if (ReactIs.isFragment(element)) {
      return this.evaluateElements(React.Children.toArray(element.props.children));
    }

    if (ReactIs.isContextProvider(element)) {
      this.contextStack.enterContext(element);

      const returnValue = this.evaluateElements(React.Children.toArray(element.props.children));
      //console.log(require('util').inspect(returnValue, { colors: true, depth: 10 }));

      this.contextStack.exitContext(element);

      return returnValue;
    }

    if (ReactIs.isContextConsumer(element)) {
      const contextValue = this.contextStack.getCurrentValue(element);

      return this.evaluateElement(element.props.children(contextValue));
    }

    if (typeof element.type === 'function') {
      return this.evaluateElement(element.type(element.props));
    }

    throw new Error(`unexpected element`);
  }
}

export {
  FileSystemRenderer,
};
