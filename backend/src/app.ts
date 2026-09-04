import express from "express"
import cors from "cors"
import cookiesParser from "cookie-parser"
import { API_PREFIX } from "./constants.js"
import authRouter from "./routes/auth.js"
import credentialRouter from "./routes/credential.js"
import healthcheckRouter from "./routes/healthcheck.js"
import sessionRouter from "./routes/session.js"
import vaultRouter from "./routes/vault.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { assertGoogleOAuthConfig } from "./lib/google.js"

const app = express()

assertGoogleOAuthConfig()

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

app.use(`${API_PREFIX}/healthcheck`, healthcheckRouter)
app.use(`${API_PREFIX}/auth`, authRouter)
app.use(`${API_PREFIX}/vault`, vaultRouter)
app.use(`${API_PREFIX}/credentials`, credentialRouter)
app.use(`${API_PREFIX}/sessions`, sessionRouter)

app.use(errorHandler)

export { app }
