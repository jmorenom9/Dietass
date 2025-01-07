import {ApolloServer} from "@apollo/server"
import {startStandaloneServer} from "@apollo/server/standalone"
import { MongoClient } from "mongodb";
import { DietModel, UserModel } from "./types.ts";
import { schema } from "./schema.ts";
import { resolvers } from "./resolvers.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");
if (!MONGO_URL) {
  //console.error("You have to provide a MONGO_URL");
  //Deno.exit(1);
  throw new Error("You have to provide a MONGO_URL");
}

const mongoClient = new MongoClient(MONGO_URL);
await mongoClient.connect();

console.info("MongoDB connected!");

const db = mongoClient.db("Nutricion");
const UsersCollection = db.collection<UserModel>("users");
const DietsCollection = db.collection<DietModel>("diets");

const server = new ApolloServer({
  typeDefs: schema,
  resolvers
});

const { url } = await startStandaloneServer(server, {
  context: async () => ({UsersCollection, DietsCollection}),
  listen: {port: 2100}
});

console.info(`Connected to ${url}`);