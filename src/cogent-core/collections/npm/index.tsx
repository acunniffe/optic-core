import * as React from 'react';

function PackageJson() {
  const packageJsonContents = {
    dependencies: {},
  };

  const File = () => (
    // @ts-ignore
    <file name="package.json">
      <source>{JSON.stringify(contents, null, 2)}</source>
    </file>
  );

  function Dependency({ name, version, exportName }) {
    if (packageJsonContents.dependencies[name]) {
      console.warn(`overwriting package.json dependency ${name}@${version}`);
    }
    packageJsonContents.dependencies[name] = version;

    return null;
  }

  return {
    File,
    Dependency
  }
}

export {
  PackageJson,
};
