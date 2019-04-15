import * as React from 'react';
import { ReactNode } from 'react';
import * as ReactIs from 'react-is';

const Indent = React.createContext({
  indent: 0,
  indentString: '  ',
  inArray: false,
  isFirstItem: false,
  isLastItem: false,
});

interface IYamlRootProps {
  children?: ReactNode,
  indentString: string,
  name: string
}

function File({ children, indentString = '  ', name }: IYamlRootProps) {
  return (
    <file name={name}>
      <source>
        <Indent.Provider value={{
          indent: -1,
          indentString,
          inArray: false,
          isFirstItem: false,
          isLastItem: false,
        }}>{children}</Indent.Provider>
      </source>
    </file>
  );
}


interface IYamlObjectRoot {
  children: ReactNode
}

function YObject({ children }: IYamlObjectRoot) {

  return (
    <source>
      <Indent.Consumer>
        {({ indent, indentString, inArray }) => {

          const childrenAsArray = React.Children.toArray(children);

          const lastIndex = childrenAsArray.length - 1;

          return <source>{
            childrenAsArray.map((child, index) => {
              const isFirstItem = index === 0;
              const isLastItem = index === lastIndex;
              const childIndent = inArray && isFirstItem ? indent : indent + 1;

              return (
                <Indent.Provider
                  value={{
                    indent: childIndent,
                    indentString,
                    inArray: false,
                    isFirstItem,
                    isLastItem,
                  }}>{child}</Indent.Provider>
              );
            })
          }</source>;
        }}
      </Indent.Consumer>
    </source>
  );
}

interface IYamlArrayRoot {
  children: ReactNode
}

function YArray({ children }: IYamlArrayRoot) {
  return (
    <source>
      <Indent.Consumer>{
        ({ indent, indentString }) => {
          return (
            <source>
              <Indent.Provider
                value={{
                  indent: indent + 1,
                  indentString,
                  inArray: true,
                  isFirstItem: false,
                  isLastItem: false,
                }}>{children}</Indent.Provider>
            </source>
          );
        }}
      </Indent.Consumer>
    </source>
  );
}

interface IYamlObjectEntry {
  name: string,
  value: ReactNode,
}

function Entry({ name, value }: IYamlObjectEntry) {

  return (
    <source key={name}>
      <Indent.Consumer>
        {({ indentString, indent, isFirstItem, isLastItem }) => {
          const contextualNewline = '\n';
          const pad = indentString.repeat(indent);
          if (isLastItem && isFirstItem) {
            return (<source>{contextualNewline}{pad}{name}: {value}</source>);
          } else if (isLastItem) {
            return (<source>{contextualNewline}{pad}{name}: {value}</source>);
          } else if (isFirstItem) {
            return (<source>{name}: {value}</source>);
          } else {
            return (<source>{contextualNewline}{pad}{name}: {value}</source>);
          }
        }}
      </Indent.Consumer>
    </source>
  );
}


interface IYamlArrayItem {
  children: ReactNode
}

function ArrayItem({ children }: IYamlArrayItem) {
  return (
    <source>
      <Indent.Consumer>
        {({ indent, indentString }) => {
          const pad = indentString.repeat(indent);
          const child = React.Children.only(children);
          if (ReactIs.isElement(child) && child.type === YObject) {
            return (
              <Indent.Provider
                value={{
                  indent: indent,
                  indentString,
                  inArray: true,
                  isFirstItem: true, isLastItem: false,
                }}>
                <source>{'\n'}{pad}- {child}</source>
              </Indent.Provider>
            );
          }

          return (<source>{'\n'}{pad}- {child}</source>);
        }}
      </Indent.Consumer>
    </source>
  );
}

export {
  YObject,
  Entry,
  File,
  YArray,
  ArrayItem,
};
