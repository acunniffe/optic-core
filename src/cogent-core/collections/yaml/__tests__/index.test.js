import React from 'react';
import * as Yaml from '../index';
import * as fs from 'fs'
import * as path from 'path'

const equalToExampleFile = (baseDir) => (file) => fs.readFileSync(path.join(baseDir, file)).toString()
const equalToExample = equalToExampleFile(__dirname)

describe('Yaml', function() {

  describe('Array Root', () => {

    it.only('can render an array properly', function() {
      const Component = () => {
        return (
          <Yaml.File name={'test.yml'}>
            <Yaml.YArray>
              <Yaml.ArrayItem>Hello</Yaml.ArrayItem>
              <Yaml.ArrayItem>I AM AIDAN</Yaml.ArrayItem>
              {/*<Yaml.ArrayItem children={"second"}/>*/}
              {/*<Yaml.ArrayItem children={"third"}/>*/}
            </Yaml.YArray>
          </Yaml.File>
        );
      };
      const { result } = global.render(<Component />);
      const contents = result.files['test.yml'].contents.join('');
      console.log(contents)
      // expect(contents).toBe(equalToExample('basic-object'))
    })


  })

  describe('Object Root', function() {
    it('can render key value entries properly', function() {
      const Component = () => {
        return (
          <Yaml.File name={'test.yml'}>
            <Yaml.YObject>
              <Yaml.Entry name={"hello"} value={"world"}/>
              <Yaml.Entry name={"one"} value={"two"}/>
            </Yaml.YObject>
          </Yaml.File>
        );
      };
      const { result } = global.render(<Component />);
      const contents = result.files['test.yml'].contents.join('');
      expect(contents).toBe(equalToExample('basic-object'))
    })

    it('can render key value entries properly when nested', function() {
      const Component = () => {
        return (
          <Yaml.File name={'test.yml'}>
            <Yaml.YObject>
              <Yaml.Entry name={"key1"} value={"value1"}/>
              <Yaml.Entry name={"key2"} value={
                <Yaml.YObject>
                  <Yaml.Entry name={"nested1"} value={"value"}/>
                  <Yaml.Entry name={"nested2"} value={
                    <Yaml.YObject>
                      <Yaml.Entry name={"doublenested1"} value={"value"}/>
                      <Yaml.Entry name={"doublenested2"} value={"value"}/>
                    </Yaml.YObject>
                  }/>
                </Yaml.YObject>
              }/>
            </Yaml.YObject>
          </Yaml.File>
        );
      };
      const { result } = global.render(<Component />);
      const contents = result.files['test.yml'].contents.join('');
      expect(contents.trim()).toBe(equalToExample('nested-object').trim())
    })
  });
});
