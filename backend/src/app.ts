import express from "express"
import cors from "cors"
import cookiesParser from "cookie-parser"
import { sql } from "drizzle-orm"
import { db } from "./db/indexdb.js"
import { API_PREFIX } from "./constants.js"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({
    limit: "32kb"
}))

app.use(express.urlencoded({
    extended: true,
    limit: "32kb"
}))
app.use(cookiesParser())



export { app }