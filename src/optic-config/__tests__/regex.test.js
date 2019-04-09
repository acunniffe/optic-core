import { documentConfig } from '../document-config';
import Joi from 'joi';
import {
  pathsNoMethodRegex,
  pathsRegex,
  apiIdRegex,
  apiIdWithTeamRegex,
  semverRegex,
  pathProcessor,
  apiIdProcessor, apiIdForKeyRegex,
} from '../regexes';

describe('Regexes', () => {

  it('matches paths valid path regexes', () => {
    expect(pathsRegex.test('post /my/url')).toBeTruthy();
    expect(pathsRegex.test('get /my/:with-param')).toBeTruthy();
    expect(pathsRegex.test('get /my/:with-param')).toBeTruthy();
    expect(pathsRegex.test('put      /my/:with-param/value')).toBeTruthy();

    expect(pathsRegex.test('post /my/:with       -param/value')).toBeFalsy();
    expect(pathsRegex.test('invalid      /my/:with-param/value')).toBeFalsy();
    expect(pathsRegex.test('invalid ')).toBeFalsy();

  });

  it('matches valid path with no method regexes', () => {
    expect(pathsNoMethodRegex.test('/my/url')).toBeTruthy();
    expect(pathsNoMethodRegex.test('/my/:with-param')).toBeTruthy();
    expect(pathsNoMethodRegex.test('/my/:with-param')).toBeTruthy();
    expect(pathsNoMethodRegex.test('/my/:with-param/value')).toBeTruthy();
    expect(pathsNoMethodRegex.test('/my/:with     -param/value')).toBeFalsy();
  });

  it('matches valid api ids', () => {
    expect(apiIdRegex.test('test-api')).toBeTruthy();
    expect(apiIdRegex.test('test')).toBeTruthy();
    expect(apiIdRegex.test('CAPITAL')).toBeFalsy();
    expect(apiIdRegex.test('te')).toBeFalsy();
  });

  it('matches valid api ids with teams', () => {
    expect(apiIdWithTeamRegex.test('optic-team/test-api')).toBeTruthy();
    expect(apiIdWithTeamRegex.test('my-team/test')).toBeTruthy();
    expect(apiIdWithTeamRegex.test('CAP/test')).toBeFalsy();
    expect(apiIdWithTeamRegex.test('lower/CAP')).toBeFalsy();
  });

  it('matches valid api ids for consume keys', () => {
    expect(apiIdForKeyRegex.test('optic-team/test-api')).toBeTruthy();
    expect(apiIdForKeyRegex.test('my-team/test')).toBeTruthy();
    expect(apiIdForKeyRegex.test('test')).toBeTruthy();

    expect(apiIdForKeyRegex.test('  abdefg  ')).toBeFalsy();
    expect(apiIdForKeyRegex.test('/test')).toBeFalsy();
    expect(apiIdForKeyRegex.test('/test')).toBeFalsy();
  });

  it('matches valid semantic versions', () => {
    expect(semverRegex.test('1.0.0')).toBeTruthy();
    expect(semverRegex.test('3.0.0')).toBeTruthy();
    expect(semverRegex.test('3.0.0-alpha1')).toBeTruthy();

    expect(semverRegex.test('me-them')).toBeFalsy();
    expect(semverRegex.test('random string')).toBeFalsy();
  });
});

describe('extractors', () => {


  describe('Path extractor', () => {

    it('can extract path and method from path', () => {
      expect(pathProcessor('/users/:id')).toEqual({
        path: '/users/:id',
        methods: ['get', 'post', 'put', 'delete', 'patch'],
      });
    });

    it('throws if invalid', () => {
      expect(() => pathProcessor('not /valid-path')).toThrow();
    });

    it('can extract path and method from path with method', () => {
      expect(pathProcessor('get /users/:id')).toEqual({
        path: '/users/:id',
        methods: ['get'],
      });
    });

  });

  describe('API Id Extractor', () => {

    it('can extract org and id', () => {
      expect(apiIdProcessor('optic-team/backend')).toEqual({
        org: 'optic-team',
        id: 'backend'
      });
    });

    it('can extract id', () => {
      expect(apiIdProcessor('backend')).toEqual({
        id: 'backend'
      });
    });


    it('throws if invalid', () => {
      expect(() => apiIdProcessor('12')).toThrow()
    });

  });

});
