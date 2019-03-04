import React from 'react';
import * as Markdown from '../index';

describe('Markdown', function() {
  describe('Basic Usage', function() {
    it('should allow rendering sections and lists and code sections', function() {
      const Component = () => {
        return (
          <file name="README.md">
            <source>
              <Markdown.Root>
                <Markdown.Section title="a1">
                  <Markdown.Section title="a2">
                    <Markdown.Section title="a3">
                      <Markdown.Section title="a4">
                        <Markdown.Section title="a5">
                        </Markdown.Section>
                      </Markdown.Section>
                    </Markdown.Section>
                  </Markdown.Section>
                </Markdown.Section>
                <Markdown.Section title="b1">
                  <Markdown.Section title="b2">
                    <Markdown.Section title="b3">
                      <Markdown.Section title="b4">
                        <Markdown.Section title="b5">
                        </Markdown.Section>
                      </Markdown.Section>
                    </Markdown.Section>
                  </Markdown.Section>
                </Markdown.Section>
              </Markdown.Root>
            </source>
          </file>
        );
      };
      const { result } = global.render(<Component/>);
      const contents = result.files['README.md'].contents.join('');
      const expectedContents = `# a1
## a2
### a3
#### a4
##### a5
# b1
## b2
### b3
#### b4
##### b5
`;
      expect(contents).toEqual(expectedContents);
    });
  });
});
