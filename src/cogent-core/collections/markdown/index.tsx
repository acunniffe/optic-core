import { ReactNode } from 'react';
import * as React from 'react';

//@TODO expose some template tags to make line breaks easier
//@TODO make React.Children.filter utility to only acceptable children?
const SectionDepth = React.createContext(1);

interface IMarkdownSectionProps {
  title: string
  children: ReactNode
}

function Section({ title, children }: IMarkdownSectionProps) {
  return (
    <source>
      <SectionDepth.Consumer>
        {(depth) => {
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
    </source>
  );
}

interface IMarkdownRootProps {
  children: ReactNode
}

function Root({ children }: IMarkdownRootProps) {
  return (
    <source>
      <SectionDepth.Provider value={1}>
        {children}
      </SectionDepth.Provider>
    </source>
  );
}

interface IMarkdownCodeProps {
  language: string
  children: ReactNode
}

function Code({ language = '', children }: IMarkdownCodeProps) {
  return (
    <React.Fragment>
      <line>```{language}</line>
      <line>{children}</line>
      <line>```</line>
    </React.Fragment>
  );
}

interface IMarkdownLinkProps {
  label: string
  to: string
}

function Link({ label = '', to = '' }: IMarkdownLinkProps) {
  return <source> [{label}]({to}) </source>;
}

interface IMarkdownLineProps {
  children: ReactNode
}

function Line({ children }: IMarkdownLineProps) {
  return (
    <line>{children}{'\n'}</line>
  );
}

interface IMarkdownUnorderedListProps {
  children: ReactNode
}

//@TODO: add depth context
function UnorderedList({ children }: IMarkdownUnorderedListProps) {
  return <line>- {children}</line>;
}

export {
  Root,
  Section,
  Code,
  Link,
  Line,
  UnorderedList,
};
