import { makeExecutableSchema } from 'graphql-tools';
import { resolvers } from './resolvers';
import { typeDefs } from './type-definitions';

const schema = makeExecutableSchema({ typeDefs, resolvers });

export {
  schema,
};
