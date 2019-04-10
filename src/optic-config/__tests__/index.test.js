import { parseOpticYaml } from '../index';

describe('optic yml interpretation', () => {

  it('works when valid', () => {

    const example = {
      document: {
        id: 'optic',
        version: '1.0.0',
        run_tests: 'npm run tests',
        paths: ['/my/path', '/api/path']
      },
      consume: {
        'other-api': {
          version: '1.0.0',
          generate: {
            'scala-client': 'src/managed'
          }
        }
      }
    }

    const parseTry = parseOpticYaml(example)
    expect(parseTry.isSuccess).toBeTruthy()

  })

  it('accepts just document', () => {

    const example = {
      document: {
        id: 'optic',
        version: '1.0.0',
        run_tests: 'npm run tests',
        paths: ['/my/path', '/api/path']
      }
    }

    const parseTry = parseOpticYaml(example)
    expect(parseTry.isSuccess).toBeTruthy()

  })

  it('accepts just consume', () => {

    const example = {
      consume: {
        'other-api': {
          version: '1.0.0',
          generate: {
            'scala-client': 'src/managed'
          }
        }
      }
    }

    const parseTry = parseOpticYaml(example)
    expect(parseTry.isSuccess).toBeTruthy()

  })

  it('throws if document post process fails in some way', () => {

    const example = {
      document: {
        id: 'optic',
        version: 'not-real-version',
        run_tests: 'npm run tests',
        paths: ['/my/path', '/api/path']
      }
    }

    const parseTry = parseOpticYaml(example)
    expect(parseTry.isSuccess).toBeFalsy()
    expect(parseTry.error).toBe('Invalid version: "not-real-version". Must be a semantic version ie 1.0.1')

  })

  it('throws if consume post process fails in some way', () => {

    const example = {
      document: {
        id: 'optic',
        version: '1.0.0',
        run_tests: 'npm run tests',
        paths: ['/my/path', '/api/path']
      },
      consume: {
        'other-api': {
          version: 'not-real',
          generate: {
            'scala-client': '/src'
          }
        }
      }
    }

    const parseTry = parseOpticYaml(example)
    expect(parseTry.isSuccess).toBeFalsy()
    expect(parseTry.error).toBe("Invalid version for other-api: \"not-real\". Must be a semantic version ie '1.0.1' or 'latest'")

  })


})
