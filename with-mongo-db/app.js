const { AuthenticationError, ApolloServer, gql } = require("apollo-server");
const db = require("./db");
const tokenService = require("../util/token");

const databaseUrl = "mongodb://localhost/easypay";

const query = gql`
  type Query {
    me: User
  }
  type Mutation {
    register(email: String!, username: String, password: String!): User!
    login(email: String!, password: String!): User!
  }
`;
const userType = gql`
  type User {
    email: String!
    username: String
    password: String!
    token: String
  }
`;

const resolvers = {
  Query: {
    me: (_, args, context) => {
      if (context.loggedIn) {
        return context.user;
      } else {
        throw new AuthenticationError("Please Login Again!");
      }
    },
  },
  Mutation: {
    register: async (_, { email, username = "", password }) => {
      const user = await db.getCollection("user").findOne({ email });
      if (user) {
        throw new AuthenticationError("User Already Exists!");
      }
      const passwordHash = await tokenService.encryptPassword(password);
      const newUser = {
        email,
        username,
        password: passwordHash,
      };

      try {
        await db.getCollection("user").insertOne(newUser);

        const token = tokenService.getToken(newUser);

        return { ...newUser, token };
      } catch (e) {
        throw e;
      }
    },
    login: async (_, { email, password }) => {
      const user = await db.getCollection("user").findOne({ email });
      if (!user) {
        throw new AuthenticationError("Authentication Failed");
      }
      const isMatch = await tokenService.comparePassword(
        password,
        user.password
      );
      if (isMatch) {
        const token = tokenService.getToken(user);
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
    db.connect(databaseUrl, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log("Successfully Connected to MongoDB!");
      }
    });
    const token = req.headers.authorization.split(" ")[1] || "";
    const { payload: user, loggedIn } = tokenService.getPayload(token);

    return { user, loggedIn };
  },
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
