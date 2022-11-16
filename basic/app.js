const { AuthenticationError, ApolloServer, gql } = require("apollo-server");
const {
  getToken,
  comparePassword,
  encryptPassword,
  getPayload,
} = require("../util/token");
const userStore = require("./userStore");

const query = gql`
  type Query {
    me: User
  }
  type Mutation {
    register(email: String!, password: String!): User!
    login(email: String!, password: String!): User!
  }
`;
const userType = gql`
  type User {
    email: String!
    password: String!
    token: String
  }
`;

const resolvers = {
  Mutation: {
    register: async (_, { email, password }) => {
      const user = userStore.find((user) => user.email == email);
      if (user) {
        throw new AuthenticationError("User Already Exists!");
      }
      const hash = await encryptPassword(password);

      const newUser = {
        email,
        password: hash,
      };
      const token = getToken(newUser);
      userStore.push(newUser);
      return { ...newUser, token };
    },
    login: async (_, { email, password }) => {
      const user = userStore.find((user) => user.email == email);
      if (!user) {
        throw new AuthenticationError("Authentication Failed");
      }
      const isMatch = await comparePassword(password, user.password);
      if (isMatch) {
        const token = getToken(user);
        return { ...user, token };
      } else {
        throw new AuthenticationError("Authentication Failed");
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs: [query, userType],
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization.split(" ")[1] || "";
    const { payload: user, loggedIn } = getPayload(token);
    return { user, loggedIn };
  },
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
