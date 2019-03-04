import * as React from 'react';

type NpmModuleId = string
type NpmModuleVersion = string

interface INpmPackageBaseMetadata {
  name: NpmModuleId,
  version: NpmModuleVersion,
}

interface INpmPeerDependency {
  moduleId: NpmModuleId
  version: NpmModuleVersion
}

interface IPackageJson {
  main?: string
  dependencies: { [key: string]: NpmModuleVersion }
}

function createPackageJson(metadata: INpmPackageBaseMetadata) {
  const packageJsonContents: IPackageJson = {
    ...metadata,
    dependencies: {},
  };

  const File = () => (
    <file name="package.json">
      <source>{JSON.stringify(packageJsonContents, null, 2)}</source>
    </file>
  );

  function addDependency({ moduleId, version }: INpmPeerDependency) {
    if (packageJsonContents.dependencies[moduleId]) {
      console.warn(`overwriting package.json peer dependency ${moduleId}@${version}`);
    }
    packageJsonContents.dependencies[moduleId] = version;

    return null;
  }

  function setMain(main: string) {
    if (packageJsonContents.main) {
      console.warn(`overwriting package.json main script`);
    }
    packageJsonContents.main = main;
  }

  return {
    File,
    addDependency,
    setMain,
  };
}

export {
  createPackageJson,
};
