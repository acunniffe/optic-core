import * as React from 'react';

//@TODO this could be done in a streaming style
//@TODO this could instead allow JSX children instead of calling .toString
function splitByNewline(strings: TemplateStringsArray, ...expressions: any[]) {
  let merged = '';
  const maxLength = Math.max(strings.length, expressions.length);
  for (let i = 0; i < maxLength; i += 1) {
    const s = strings[i] === undefined ? '' : strings[i];
    const e = expressions[i] === undefined ? '' : expressions[i].toString();
    merged += s;
    merged += e;
  }
  return merged.split('\n');
}

function toLines(strings: TemplateStringsArray, ...expressions: any[]) {
  return splitByNewline(strings, ...expressions).map((s: string, i: number) => <line key={i}>{s}</line>);
}

export {
  splitByNewline,
  toLines,
};
