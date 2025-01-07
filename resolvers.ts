import { Collection, ObjectId } from "mongodb";
import {
  APIExercises,
  APINutrition,
  DietModel,
  UserModel,
} from "./types.ts";
import { GraphQLError } from "graphql";
type Context = {
  UsersCollection: Collection<UserModel>;
  DietsCollection: Collection<DietModel>;
};

type GetQueryArgs = {
  id: string;
};

type AddDietMutationArgs = {
  name: string;
};

type AddUserMutationArgs = {
  name: string;
  muscle: string;
  diets: string[];
};

type DeleteMutationArgs = {
  id: string;
};

type UpdateDietMutationArgs = {
  id: string;
  name: string;
};

type UpdateUserMutationArgs = {
  id: string;
  name: string;
  muscle: string;
  diets: string[];
};

type deleteDietInUserMutationArgs = {
  id_user: string;
  id_diet: string;
};

export const resolvers = {
  Query: {
    getUsers: async (
      _: unknown,
      __: unknown,
      ctx: Context
    ): Promise<UserModel[]> => {
      return await ctx.UsersCollection.find().toArray();
    },

    getDiets: async (
      _: unknown,
      __: unknown,
      ctx: Context
    ): Promise<DietModel[]> => {
      return await ctx.DietsCollection.find().toArray();
    },

    getUser: async (
      _: unknown,
      args: GetQueryArgs,
      ctx: Context
    ): Promise<UserModel | null> => {
      return await ctx.UsersCollection.findOne({ _id: new ObjectId(args.id) });
    },

    getDiet: async (
      _: unknown,
      args: GetQueryArgs,
      ctx: Context
    ): Promise<DietModel | null> => {
      return await ctx.DietsCollection.findOne({ _id: new ObjectId(args.id) });
    },
  },

  Mutation: {
    addDiet: async (
      _: unknown,
      args: AddDietMutationArgs,
      ctx: Context
    ): Promise<DietModel> => {
      const { name } = args;
      if (!name)
        throw new GraphQLError("Faltan argumentos: 'name' es obligatorio");

      const dietExists = await ctx.DietsCollection.countDocuments({ name });
      if (dietExists > 0) throw new GraphQLError("La dieta ya existe");

      const api_key = Deno.env.get("X_API_KEY");
      if (!api_key)
        throw new GraphQLError(
          "API Key no encontrada en las variables de entorno"
        );

      const url = `https://api.api-ninjas.com/v1/nutrition?query=${name}`;
      const data = await fetch(url, {
        headers: {
          "X-Api-Key": api_key,
        },
      });

      if (data.status !== 200)
        throw new GraphQLError(
          `Error al obtener datos de la API: ${data.statusText}`
        );

      const response: APINutrition[] = await data.json();

      if (response.length === 0) throw new GraphQLError("dieta no válida");

      const nutrition = response[0];

      const carbohydrates = nutrition.carbohydrates_total_g;
      const cholesterol = nutrition.cholesterol_mg;
      const sugar = nutrition.sugar_g;
      const fat_total = nutrition.fat_total_g;

      const { insertedId } = await ctx.DietsCollection.insertOne({
        name,
        carbohydrates,
        cholesterol,
        sugar,
        fat_total,
      });

      return {
        _id: insertedId,
        name,
        carbohydrates,
        cholesterol,
        sugar,
        fat_total,
      };
    },

    addUser: async (
      _: unknown,
      args: AddUserMutationArgs,
      ctx: Context
    ): Promise<UserModel> => {
      const { name, muscle, diets } = args;
      if (!name && !muscle) throw new GraphQLError("no args");
      const userExists = await ctx.UsersCollection.countDocuments({ name });
      if (userExists === 1) throw new GraphQLError("usuario ya existe");

      const allDiets = diets.map((elem) => new ObjectId(elem));

      const dietExists = await ctx.DietsCollection.find({
        _id: { $in: allDiets },
      }).toArray();
      console.log(dietExists);
      if (dietExists.length !== diets.length)
        throw new GraphQLError("alguna dieta no existe");

      const api_key = Deno.env.get("X_API_KEY");
      if (!api_key) throw new GraphQLError("you need an api key");

      const url = `https://api.api-ninjas.com/v1/exercises?muscle=${muscle}`;
      const data = await fetch(url, {
        headers: {
          "X-Api-Key": api_key,
        },
      });

      if (data.status !== 200) throw new GraphQLError("api ninja error");

      const response: APIExercises[] = await data.json();

      if (response.length === 0) throw new GraphQLError("ejercicio no válida");

      const ej = response[0];

      const type = ej.type;

      const { insertedId } = await ctx.UsersCollection.insertOne({
        name: name,
        muscle: muscle,
        type: type,
        diets: allDiets,
      });
      return {
        _id: insertedId,
        name: name,
        muscle: muscle,
        type: type,
        diets: allDiets,
      };
    },

    deleteUser: async (
      _: unknown,
      args: DeleteMutationArgs,
      ctx: Context
    ): Promise<boolean> => {
      const { id } = args;
      const { deletedCount } = await ctx.UsersCollection.deleteOne({
        _id: new ObjectId(id),
      });
      if (!deletedCount) return false;
      return true;
    },

    deleteDiet: async (
      _: unknown,
      args: DeleteMutationArgs,
      ctx: Context
    ): Promise<boolean> => {
      const { id } = args;
      const deleteDietInUser = await ctx.UsersCollection.updateMany(
        { diets: new ObjectId(id) },
        {
          $pull: {
            diets: new ObjectId(id),
          },
        }
      );
      const { deletedCount } = await ctx.DietsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      if (!deletedCount) return false;
      return true;
    },

    updateDiet: async (
      _: unknown,
      args: UpdateDietMutationArgs,
      ctx: Context
    ): Promise<DietModel | null> => {
      const { id, name } = args;
      if (!id && !name) throw new GraphQLError("No args");
      const dietExists = await ctx.DietsCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!dietExists) throw new GraphQLError("Dieta no existe");

      const api_key = Deno.env.get("X_API_KEY");
      if (!api_key)
        throw new GraphQLError(
          "API Key no encontrada en las variables de entorno"
        );

      const url = `https://api.api-ninjas.com/v1/nutrition?query=${name}`;
      const data = await fetch(url, {
        headers: {
          "X-Api-Key": api_key,
        },
      });

      if (data.status !== 200)
        throw new GraphQLError(
          `Error al obtener datos de la API: ${data.statusText}`
        );

      const response: APINutrition[] = await data.json();

      if (response.length === 0) throw new GraphQLError("dieta no válida");

      const nutrition = response[0];

      const carbohydrates = nutrition.carbohydrates_total_g;
      const cholesterol = nutrition.cholesterol_mg;
      const sugar = nutrition.sugar_g;
      const fat_total = nutrition.fat_total_g;

      const newDiet = await ctx.DietsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            name: name,
            carbohydrates: carbohydrates,
            cholesterol: cholesterol,
            sugar: sugar,
            fat_total: fat_total,
          },
        }
      );
      return {
        name,
        carbohydrates,
        cholesterol,
        sugar,
        fat_total,
      };
    },

    updateUser: async (
      _: unknown,
      args: UpdateUserMutationArgs,
      ctx: Context
    ): Promise<UserModel | null> => {
      const { id, name, muscle, diets } = args;
      if (!id) throw new GraphQLError("You need an id");
      const userExists = await ctx.UsersCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!userExists) throw new GraphQLError("Usuario no existe");

      const allDiets = diets.map((elem) => new ObjectId(elem));
        console.log(allDiets);
        const dietsExists = await ctx.DietsCollection.find({
          _id: { $in: allDiets },
        }).toArray();
        if (dietsExists.length !== diets.length)
          throw new GraphQLError("Alguna dieta no existe");

      if (name || diets) {
        const newUser = await ctx.UsersCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
              $set: {
                name: name,
                muscle: userExists.muscle,
                type: userExists.type,
                diets: allDiets || userExists.diets,
              },
            }
          );
          return newUser;
      }

      if (muscle || name || diets) {
        const api_key = Deno.env.get("X_API_KEY");
        if (!api_key) throw new GraphQLError("you need an api key");

        const url = `https://api.api-ninjas.com/v1/exercises?muscle=${muscle}`;
        const data = await fetch(url, {
          headers: {
            "X-Api-Key": api_key,
          },
        });

        if (data.status !== 200) throw new GraphQLError("api ninja error");

        const response: APIExercises[] = await data.json();

        if (response.length === 0)
          throw new GraphQLError("ejercicio no válida");

        const ej = response[0];

        const type = ej.type;

        const newUser = await ctx.UsersCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          {
            $set: {
              name: name || userExists.name,
              muscle: muscle || userExists.muscle,
              type: type || userExists.type,
              diets: allDiets || userExists.diets,
            },
          }
        );
        return newUser;
      }

      return userExists;
      
    },

    deleteDietInUser: async (
      _: unknown,
      args: deleteDietInUserMutationArgs,
      ctx: Context
    ): Promise<boolean> => {
      const { id_diet, id_user } = args;
      const userExists = await ctx.UsersCollection.findOne({
        _id: new ObjectId(id_user),
      });
      if (!userExists) throw new GraphQLError("usuario no existe");
      const dietExists = await ctx.DietsCollection.findOne({
        _id: new ObjectId(id_diet),
      });
      if (!dietExists) throw new GraphQLError("dieta no existe");
      const updateDiets = await ctx.UsersCollection.updateMany(
        { _id: new ObjectId(id_user) },
        {
          $pull: {
            diets: new ObjectId(id_diet),
          },
        }
      );
      console.log(updateDiets);
      const confirmUser = await ctx.UsersCollection.findOne(
        { _id: new ObjectId(id_user) } && { diets: new ObjectId(id_diet) }
      );
      if (confirmUser) return false;
      return true;
    },
  },

  User: {
    id: (parent: UserModel, _: unknown, __: unknown) => {
      return parent._id?.toString();
    },

    diets: async (
      parent: UserModel,
      _: unknown,
      ctx: Context
    ): Promise<DietModel[] | null> => {
      const id = parent.diets;
      const d = await ctx.DietsCollection.find({ _id: { $in: id } }).toArray();
      return d;
    },
  },

  Diet: {
    id: (parent: DietModel, _: unknown, __: unknown) => {
      return parent._id?.toString();
    },

    users: async (parent: DietModel, __: unknown, ctx: Context) => {
      return await ctx.UsersCollection.find({ diets: parent._id }).toArray();
    },
  },
};
