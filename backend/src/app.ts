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

app.get(`${API_PREFIX}/healthcheck/database`,
    async (_request, response) => {
    const result = await db.execute(sql`
      SELECT
        1::integer AS connected,
        current_database() AS database_name,
        current_user AS database_user,
        NOW() AS server_time
    `);

    const row = result.rows[0];

    response.status(200).json({
      status: "ok",
      database: {
        connected: Number(row?.connected) === 1,
        name: row?.database_name,
        user: row?.database_user,
        serverTime: row?.server_time
      }
    });
  }
);

export { app }