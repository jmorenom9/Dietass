export const schema = `#graphql

    type User {
        id: ID!
        name: String!
        muscle: String!
        type: String!
        diets: [Diet!]!
    }

    type Diet {
        id: ID!
        name: String!
        carbohydrates: Float!
        cholesterol: Float!
        sugar: Float!
        fat_total: Float!
        users: [User!]!
    }

    type Query {
        getUsers: [User!]!
        getUser(id: ID!): User
        getDiets: [Diet!]!
        getDiet(id: ID!): Diet
    }

    type Mutation {
        addUser(name: String!, muscle: String!, diets: [ID!]!): User!
        addDiet(name: String!): Diet! 
        deleteUser(id: ID!): Boolean!
        deleteDiet(id: ID!): Boolean!
        updateUser(id: ID!, name: String, muscle: String, diets: [ID!]): User!
        updateDiet(id: ID!, name: String!): Diet!
        deleteDietInUser(id_user: ID!, id_diet: ID!): Boolean!
    }

`