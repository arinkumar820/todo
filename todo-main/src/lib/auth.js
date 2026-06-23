import {betterAuth} from "better-auth"
import { Db } from "mongodb"

export const auth = betterAuth({
    database: Db,
    emailAndPassword: {
        enabled: true,
    }
})        