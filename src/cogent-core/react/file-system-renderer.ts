/*
@TODO expose types with Cogent Intrinsic Elements
https://www.typescriptlang.org/docs/handbook/jsx.html
*/

declare global {
  namespace JSX {
    interface IntrinsicElements {
      file: any
      folder: any
    }
  }
}
import * as React from 'react';
import * as ReactIs from 'react-is';
import { ContextStack } from './context-stack';

export interface IFileSystemRendererOptions {
  callback: Callback<IFileSystemRendererFolder>
}

type FileName = string
type FolderName = string
type PathName = string

//@TODO add postprocessors like formatting and linting, might need to be an intrinsic element around files/folders
export interface IFileSystemRendererFile {
  name: FileName
  path: PathName
  contents: string[]
}

export interface IFileSystemRendererFolder {
  name: FolderName
  path: PathName
  files: { [path: string]: IFileSystemRendererFile }
  folders: { [path: string]: IFileSystemRendererFolder }
}

type Stack<T> = T[]
type Task = () => void
type TaskList = Task[]
export type Callback<T> = (err: Error | null, result?: T) => void

//@TODO support React hooks
class FileSystemRenderer {
  private readonly contextStack: ContextStack = new ContextStack();
  private readonly intrinsicElementTypes: Set<string> = new Set(['folder', 'file', 'source', 'line']);
  private readonly subtreeTasks: Stack<TaskList> = [];
  private subtreeTaskCursor: number;

  public renderSync(element: JSX.Element, options: IFileSystemRendererOptions) {
    try {
      const rootFolder = {
        name: '',
        path: '',
        files: {},
        folders: {},
      };
      this.subtree(() => {
        const rootNodes = this.evaluateElement(element);
        rootNodes.forEach((rootNode) => {
          this.renderSyncHelper(rootNode, rootFolder);
        });
      });

      options.callback(null, rootFolder);
    } catch (e) {
      options.callback(e);
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

      this.subtree(() => {
        const childNodes = this.evaluateElements(React.Children.toArray(children));
        childNodes.forEach((child) => {
          if (child.type === 'file') {
            this.renderSyncHelper(child, folder);
          } else if (child.type === 'folder') {
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
      this.subtree(() => {
        const childNodes = this.evaluateElements(React.Children.toArray(children));
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

  private addTask(task: Task) {
    this.subtreeTasks[this.subtreeTaskCursor].push(task);
  }

  private subtree(workForSubtree: () => void) {
    this.subtreeTaskCursor = this.subtreeTasks.push([]) - 1;
    workForSubtree();
    const tasks = this.subtreeTasks.pop();
    tasks.forEach((task: Task) => task());
    this.subtreeTaskCursor -= 1;
  }

  private appendToFile(element: JSX.Element, file: IFileSystemRendererFile) {
    this.subtree(() => {
      const childNodes = this.evaluateElements(React.Children.toArray(element.props.children));
      childNodes.forEach((child) => {
        //@TODO other primitives?
        if (typeof child === 'string') {
          file.contents.push(child);
        } else if (child.type === 'line') {
          this.appendToFile(child, file);
          file.contents.push('\n');
        } else if (child.type === 'source') {
          this.appendToFile(child, file);
        } else {
          console.warn(`<file> should only have string or <line> or <source> children`, child);
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
      let returnValue;
      this.subtree(() => {
        returnValue = this.evaluateElements(React.Children.toArray(element.props.children));
      });

      return returnValue;
    }

    if (ReactIs.isContextProvider(element)) {
      this.contextStack.enterContext(element as any);
      let returnValue;
      this.subtree(() => {
        returnValue = this.evaluateElements(React.Children.toArray(element.props.children));
      });
      //console.log(require('util').inspect(returnValue, { colors: true, depth: 10 }));

      this.addTask(() => {
        this.contextStack.exitContext(element as any);
      });

      return returnValue;
    }

    if (ReactIs.isContextConsumer(element)) {
      const contextValue = this.contextStack.getCurrentValue(element as any);
      let returnValue;
      this.subtree(() => {
        returnValue = this.evaluateElement(element.props.children(contextValue));
      });

      return returnValue;
    }

    if (typeof element.type === 'function') {
      let returnValue;
      this.subtree(() => {

        returnValue = this.evaluateElement(element.type(element.props));
      });

      return returnValue;
    }

    throw new Error(`unexpected element`);
  }
}

function stringify(folder: IFileSystemRendererFolder, acc: string = '') {
  let output = '';
  Object.keys(folder.folders)
    .forEach((folderName: string) => {
      const f = folder.folders[folderName];
      stringify(f);
    });
  Object.keys(folder.files)
    .forEach((fileName: string) => {
      const file = folder.files[fileName];
      output += (`${file.path}:\n==\n${file.contents.join('')}\n==\n`);
    });

  return acc + output;
}

export {
  stringify,
  FileSystemRenderer,
};
