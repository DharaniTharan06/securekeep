import type { CookieOptions } from "express"
import ms, { StringValue } from "ms"

const SESSION_COOKIE_NAME = "session_token"

const sessionCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ms(process.env.SESSION_EXPIRY as StringValue),
    path: "/",
}

export { SESSION_COOKIE_NAME, sessionCookieOptions }
