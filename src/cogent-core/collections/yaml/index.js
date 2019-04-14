import { ReactNode } from 'react';
import React from 'react';

const Indent = React.createContext({ indent: 0, indentString: '  ', inArray: false, firstInArray: false });

function File({ children, indentString = '  ', name }) {
  return (
    <file name={name}>
      <source><Indent.Provider value={{ indent: -1, indentString, inArray: false }}>{children}</Indent.Provider></source>
    </file>
  );
}


function YObject({ children }) {

  return (
    <source><Indent.Consumer>
        {({ indent, indentString, inArray }) => {

          const childrenAsArray = React.Children.toArray(children);

          if (inArray) {

            const first = childrenAsArray;
            const remaining = childrenAsArray.splice(1);

            return (
              <React.Fragment>
                <source><Indent.Provider value={{ indent: indent, indentString, inArray: false, firstInArray: true }}>{first}</Indent.Provider></source>
                <source><Indent.Provider value={{ indent: indent + 1, indentString, inArray: false, firstInArray: false }}>{remaining}</Indent.Provider></source>
              </React.Fragment>
            );
          }

          return (
            <source><Indent.Provider value={{ indent: indent + 1, indentString, inArray: false }}>{childrenAsArray}</Indent.Provider></source>
          );
        }}
      </Indent.Consumer></source>
  );
}

function YArray({ children }) {
  return (
    <source><Indent.Consumer>
        {({ indent, indentString, inArray }) => {
          return (
            <source><Indent.Provider value={{ indent: indent + 1, indentString, inArray: true }}>{children}</Indent.Provider></source>
          );
        }}
      </Indent.Consumer></source>
  );
}

function Entry({ name, value }) {

  const wrappedValue = (typeof value === 'string') ? value : ['\n', value];

  return (
    <line key={name}>
      <Indent.Consumer>
        {({indentString, indent, firstInArray}) => {
          const pad = indentString.repeat(indent);
          if (firstInArray) {
            return (<source>{name}: {wrappedValue}</source>);
          } else {
            return (<source>{pad}{name}: {wrappedValue}</source>);
          }
        }}
      </Indent.Consumer>
    </line>
  );
}

function ArrayItem({ children }) {
  return (
    <line>
      <Indent.Consumer>
        {({ indent, indentString, inArray }) => {
          const pad = indentString.repeat(indent);

          if (children.type && children.type.name === 'YObject') {
            return (<Indent.Provider value={{ indent: indent, indentString, inArray: true }}>
              <source>{pad}- {children}</source>
            </Indent.Provider>);
          }

          return (<source>{pad}- {children}</source>);
        }}
      </Indent.Consumer>
    </line>
  );
}

export default {
  YObject,
  Entry,
  File,
  YArray,
  ArrayItem,
};
