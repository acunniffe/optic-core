import { FileSystemRenderer } from '../../../react/file-system-renderer';
import React from 'react';
import * as Markdown from '../index';

describe('Markdown', function() {
  describe('Basic Usage', function() {
    it('should allow rendering sections and lists and code sections', function() {
      const Component = () => {
        return (
          <file name="README.md">
            <Markdown.Root>
            </Markdown.Root>
          </file>
        );
      };
      const callback = jest.fn();
      const renderer = new FileSystemRenderer();
      renderer.renderSync(<Component/>, {}, callback);
      const [err, result] = callback.mock.calls[0];
      if (err) {
        console.error(err);
      }
      expect(err).toBeNull();
      console.log(result);
      const contents = result.files['README.md'].contents.join('');
      const expectedContents = `
# Getting Started
      `;
      expect(contents).toEqual(expectedContents);
    });
  });
});
