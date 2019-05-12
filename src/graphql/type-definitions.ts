const typeDefs = `
  scalar JSON
  
  type JsonSchemaLike {
    asJsonSchema: JSON
  }
  
  type HeaderParameter {
    nameKey: String
    name: String
    schema: JsonSchemaLike
  }
  
  type QueryParameter {
    nameKey: String
    name: String
    schema: JsonSchemaLike
  }
  
  type PathParameter {
    nameKey: String
    name: String
    schema: JsonSchemaLike
  }
  
  type SecurityDefinition {
    nameKey: String
    definition: JSON
  }
  
  type RequestBody {
    nameKey: String
    contentType: String
    schema: JsonSchemaLike
  }
  
  type Request {
    nameKey: String
    headerParameters: [HeaderParameter]
    queryParameters: [QueryParameter]
    pathParameters: [PathParameter]
    bodies: [RequestBody]
  }
  
  type ResponseHeader {
    nameKey: String
    name: String
    schema: JsonSchemaLike
  }
  
  type ResponseCookie {
    nameKey: String
    name: String
    schema: JsonSchemaLike
  }
  
  type ResponseBody {
    nameKey: String
    contentType: String
    schema: JsonSchemaLike
  }
  
  type Response {
    nameKey: String
    statusCode: Int
    headers: [ResponseHeader]
    cookies: [ResponseCookie]
    bodies: [ResponseBody]
  }
  
  type Endpoint {
    nameKey: String
    path: String
    method: String
    request: Request
    responses: [Response]
    securityDefinitions: [SecurityDefinition]
  }
  
  type Snapshot {
    endpoints: [Endpoint]
    securityDefinitions: [SecurityDefinition]
  }

  type Query {
    snapshot(snapshotId: ID): Snapshot
    snapshotFromGraphContext: Snapshot
  }
`;

export {
    typeDefs
};
