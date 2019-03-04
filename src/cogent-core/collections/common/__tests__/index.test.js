import * as React from 'react';
import { splitByNewline, toLines } from '../index';

describe('Common', function() {
  describe('splitByNewline', function() {
    it('should split the template literal by newlines', function() {
      const timeout = 3000;
      const split = splitByNewline`
return new Promise((resolve, reject) => {
  setTimeout(resolve, ${timeout});
});
`;
      expect(split).toEqual([
        '',
        'return new Promise((resolve, reject) => {',
        '  setTimeout(resolve, 3000);',
        '});',
        '',
      ]);
    });
  });
  describe('toLines', function() {
    it('should split the evaluated template literal by newlines and wrap with <line>', function() {
      const timeout = 3000;
      const Component = () => {
        return (
          <file name="test">
            <source>
              {toLines`
return new Promise((resolve, reject) => {
  setTimeout(resolve, ${timeout});
});`}
            </source>
          </file>
        );
      };
      const { result } = global.render(<Component/>);
      const contents = result.files.test.contents.join('');
      expect(contents).toEqual(`
return new Promise((resolve, reject) => {
  setTimeout(resolve, 3000);
});
`);
    });
  });
});
