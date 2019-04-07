import { ReactNode } from 'react';
import * as React from 'react';
import { Line } from '../markdown';

const Indent = React.createContext({ indent: 0, indentString: '  ', inArray: false, indexInArray: undefined });

interface IYamlRootProps {
  children: ReactNode,
  indentString: string,
  name: string
}

function File({ children, indentString = '  ', name }: IYamlRootProps) {
  return (
    <file name={name}>
      <source>
        <Indent.Provider value={{ indent: -1, indentString, inArray: false }}>
          {children}
        </Indent.Provider>
      </source>
    </file>
  );
}


interface IYamlObjectRoot {
  children: ReactNode[]
}

function YObject({ children }: IYamlObjectRoot) {
  return (
    <source>

      <Indent.Consumer>
        {({ indent, indentString, inArray }) => {
          return (
            <source>
              <Indent.Provider value={{ indent: indent + 1, indentString, inArray: false }}>
                {children}
              </Indent.Provider>
            </source>
          );
        }}
      </Indent.Consumer>
    </source>
  );
}

interface IYamlArrayRoot {
  children: ReactNode[]
}

function YArray({ children }: IYamlArrayRoot) {
  return (
    <source>
      <Indent.Consumer>
        {({ indent, indentString }) =>
          <React.Fragment>
            {children.map((child, index) => {
              return (<Indent.Provider key={index.toString()}
                                       value={{ indent, indentString, inArray: true, indexInArray: index }}>
                ABCDEFG
                {/*{child}*/}
              </Indent.Provider>);
            })}
          </React.Fragment>
        }
      </Indent.Consumer>
      {/*<Indent.Consumer>*/}
      {/*  {({ indent, indentString }) => {*/}
      {/*    return children.map((child: ReactNode, index: number) => (*/}
      {/*        <Indent.Provider key={index}*/}
      {/*                         value={{ indent: indent + 1, indentString, inArray: true, indexInArray: index }}>*/}
      {/*          {child}*/}
      {/*        </Indent.Provider>*/}
      {/*    ));*/}
      {/*  }}*/}
      {/*</Indent.Consumer>*/}
    </source>
  );
}

interface IYamlObjectEntry {
  name: string,
  value: ReactNode
}

function Entry({ name, value }: IYamlObjectEntry) {

  const wrappedValue = (typeof value === 'string') ? value : ['\n', value];

  return (
    <line key={name}>
      <Indent.Consumer>
        {({ indent, indentString, inArray }) => {
          const pad = indentString.repeat(indent);
          return (<source>{pad}{name}: {wrappedValue}</source>);
        }}
      </Indent.Consumer>
    </line>
  );
}


interface IYamlArrayItem {
  children: ReactNode
}

function ArrayItem({ children }: IYamlArrayItem) {
  return (
    <line>
      <Indent.Consumer>
        {({ indent, indentString, inArray, indexInArray }) => {
          const pad = indentString.repeat(indent);

          return (<source>abcdefg</source>);
        }}
      </Indent.Consumer>
    </line>
  );
}

export {
  YObject,
  Entry,
  File,
  YArray,
  ArrayItem,
};
