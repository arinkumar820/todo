import {betterAuth} from "betterAuth.js"

export const auth = betterAuth({
    database: "mongodb://localhost:27017/auratodo",
    emailandPassword: {
        enabled: true,
    }
})        