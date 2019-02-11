export interface ISchemaRoot {
  $schema: string
  type?: string
  oneOf?: object[]
}

function schemaWithoutSchemaKey(schema: ISchemaRoot) {
  const { $schema, ...rest } = schema;

  return rest;
}

class DefaultSchemaMerger {
  public static getMergedSchema(...schemas: object[]) {
    if (schemas.length === 1) {
      return schemas[0];
    }

    const typesSet = new Set(schemas.map((x: ISchemaRoot) => x.type));
    const types: string[] = [...typesSet];

    const mergedSchema: ISchemaRoot = {
      $schema: 'http://json-schema.org/draft-04/schema#',
    };

    if (types.length === 1) {
      return schemas[0];
    } else {
      mergedSchema.oneOf = schemas.map(schemaWithoutSchemaKey);
    }

    return mergedSchema;
  }
}

export {
  DefaultSchemaMerger,
};
