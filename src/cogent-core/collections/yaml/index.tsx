import * as React from 'react';
import { ReactElement, ReactNode } from 'react';

const ParentContext = React.createContext([]);

const Indent = React.createContext({
  indent: 0,
  indentString: '  ',
  isFirstEntry: false,
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
        <ParentContext.Provider value={[]}>
          <source>
            <Indent.Provider value={{
              indent: -1,
              indentString,
              isFirstEntry: false,
            }}>{children}</Indent.Provider>
          </source>
        </ParentContext.Provider>
      </source>
    </file>
  );
}


interface IYamlObjectRoot {
  children: ReactNode,
  parents: ParentContextType[]
}

enum ParentContextType {
  'object' = 'object',
  'array' = 'array'
}

type HOC<T> = (w: any) => (ReactElement<T>)

function withParentContext<T>(Wrapped: any): HOC<T> {
  return function(props: T) {
    return (
      <ParentContext.Consumer>
        {(parents: any) => {
          return <Wrapped {...props} parents={parents}/>;
        }}
      </ParentContext.Consumer>
    );
  };
}

const YObject = withParentContext<IYamlObjectRoot>(
  function YObjectInternal({ children, parents }: IYamlObjectRoot) {

    return (
      <source>
        <Indent.Consumer>
          {({ indent, indentString }) => {

            const childrenAsArray = React.Children.toArray(children);


            return <source>{
              childrenAsArray.map((child, index) => {
                const isFirstEntry = index === 0;

                return (
                  <ParentContext.Provider value={[...parents, ParentContextType.object]}>
                    <source>
                      <Indent.Provider
                        value={{
                          indent: indent + 1,
                          indentString,
                          isFirstEntry,
                        }}>{child}</Indent.Provider>
                    </source>
                  </ParentContext.Provider>
                );
              })
            }</source>;
          }}
        </Indent.Consumer>
      </source>
    );
  },
);


interface IYamlArrayRoot {
  children: ReactNode,
  parents: ParentContextType[]
}

const YArray = withParentContext<IYamlArrayRoot>(
  function YArrayInternal({ children, parents }: IYamlArrayRoot) {
    return (
      <source>
        <ParentContext.Provider value={[...parents, ParentContextType.array]}>
          <source>
            <Indent.Consumer>{
              ({ indent, indentString }) => {
                return (
                  <source>
                    <Indent.Provider
                      value={{
                        indent: indent + 1,
                        indentString,
                        isFirstEntry: false,
                      }}>{children}</Indent.Provider>
                  </source>
                );
              }}
            </Indent.Consumer>
          </source>
        </ParentContext.Provider>
      </source>
    );
  },
);

interface IYamlObjectEntry {
  name: string,
  value: ReactNode,
}

function Entry({ name, value }: IYamlObjectEntry) {

  return (
    <source key={name}>
      <ParentContext.Consumer>
        {(parents) => {

          return (
            <source><Indent.Consumer>
              {({ indentString, indent, isFirstEntry }) => {

                let shouldBeOnNewLine = true;
                if (parents.length >= 2) {
                  const lastTwoParents = parents.slice(-2);
                  const [grandparent] = lastTwoParents;
                  if (grandparent === ParentContextType.array) {
                    shouldBeOnNewLine = !isFirstEntry;
                  }
                }
                const contextualNewline = shouldBeOnNewLine ? '\n' : '';
                const pad = shouldBeOnNewLine ? indentString.repeat(indent) : '';

                return (<source>{contextualNewline}{pad}{name}: {value}</source>);
              }}
            </Indent.Consumer></source>
          );
        }}
      </ParentContext.Consumer>
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

          return (
            <source>{'\n'}{pad}- {child}</source>
          );
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
