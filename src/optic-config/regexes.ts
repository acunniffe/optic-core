//Patterns
export const pathsRegex = /^(get|post|put|delete|patch)\s*([^\s\\]*)$/;
export const pathsNoMethodRegex = /^([^\s\\]*)$/;

const rawApiId = '([a-z][a-z0-9-]{2,50})';
export const apiIdRegex = new RegExp(`^${rawApiId}$`);
export const apiIdWithTeamRegex = new RegExp(`^${rawApiId}/${rawApiId}$`);

export const apiIdForKeyRegex = /^([a-z][a-z0-9-]{2,50}\/)?([a-z][a-z0-9-]{2,50})$/

export const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(\+[0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*)?$/
export const semverOrLatestRegex = /^latest|(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(\+[0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*)?$/

export const cogentIdRegex = apiIdRegex

//Extractors
export interface IProvidedPath {
  methods: string[]
  path: string
}

export function pathProcessor(input: string): IProvidedPath {
  if (pathsRegex.test(input)) {
    const match = pathsRegex.exec(input)

    return {path: match[2], methods: [match[1]]}
  } else if (pathsNoMethodRegex.test(input)) {

    return { path: input, methods:
        ['get', 'post', 'put', 'delete', 'patch'] };
  }

  throw new Error(`Invalid path: ${input}\n\nShould follow format "{method} {url-path}" ie "post users/:userId`)
}

export interface IApiId {
  org?: string
  id: string
}


export function apiIdProcessor(input: string): IApiId {
  if (apiIdWithTeamRegex.test(input)) {
    const match = apiIdWithTeamRegex.exec(input)

    return {org: match[1], id: match[2]}
  } else if (apiIdRegex.test(input)) {

    return {id: input}
  }

  throw new Error(`Invalid API ID: ${input}\n\nShould be lowercase, alphanumeric, and start with a letter`)
}
