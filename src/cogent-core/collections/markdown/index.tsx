import * as React from 'react';
import * as Markdown from './__tests__/index.test';
//@TODO expose some template tags to make line breaks easier
//@TODO make React.Children.filter utility to only acceptable children?
const SectionDepth = React.createContext(1);

function Line({ children }) {
  return (
    <source>{children}{'\n'}</source>
  );
}


function Section({ title, children }) {
  return (
    <Line>
      <SectionDepth.Consumer>
        {(depth) => {
          console.warn({ depth, title });
          return (
            <source>
              <Line>{'#'.repeat(depth)} {title}</Line>
              <SectionDepth.Provider value={depth + 1}>
                {children}
              </SectionDepth.Provider>
            </source>
          );
        }}
      </SectionDepth.Consumer>
    </Line>
  );
}

function Root({ children }) {
  return (
    <SectionDepth.Provider value={1}>
      <Section title="d1">
        <Section title="d2">
          <Section title="d3">
            <Section title="d4">
              <Section title="d5">
              </Section>
            </Section>
          </Section>
        </Section>
      </Section>
    </SectionDepth.Provider>
  );
}

function Code({ language = '', children }) {
  return (
    <React.Fragment>
      <Line>```{language}</Line>
      <Line>{children}</Line>
      <Line>```</Line>
    </React.Fragment>
  );
}

export {
  Root,
  Section,
  Line,
  Code,
};
