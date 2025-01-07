import {OptionalId,ObjectId} from "mongodb"

export type UserModel = OptionalId<{
    name: string,
    muscle: string,
    type: string,
    diets: ObjectId[]
}>

export type DietModel = OptionalId<{
    name: string,
    carbohydrates: number,
    cholesterol: number,
    sugar: number,
    fat_total: number
}>

export type User = {
    id: string,
    name: string,
    muscle: string,
    type: string,
    diets: Diet[]
}

export type Diet = {
    id: string,
    name: string,
    carbohydrates: number,
    cholesterol: number,
    sugar: number,
    fat_total: number,
    users: User[]
}

//https://api.api-ninjas.com/v1/exercises?muscle=biceps
export type APIExercises = {
    muscle: string,
    type: string
}

// https://api.api-ninjas.com/v1/nutrition?query=pizza
export type APINutrition = {
    name: string,
    carbohydrates_total_g: number,
    cholesterol_mg: number,
    sugar_g: number,
    fat_total_g: number
}