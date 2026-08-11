import type { CookieOptions } from "express"
import ms, { StringValue } from "ms"

const SESSION_COOKIE_NAME = "session_token"
const OAUTH_STATE_COOKIE_NAME = "oauth_state"
const DEFAULT_SESSION_EXPIRY = "7d"
const OAUTH_STATE_COOKIE_MAX_AGE_MS = 1000 * 60 * 10

const getSessionMaxAge = (): number => {
    const sessionExpiry = process.env.SESSION_EXPIRY || DEFAULT_SESSION_EXPIRY
    const maxAge = ms(sessionExpiry as StringValue)

    if (typeof maxAge !== "number") {
        return ms(DEFAULT_SESSION_EXPIRY)
    }

    return maxAge
}

const sessionCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: getSessionMaxAge(),
    path: "/",
}

const oauthStateCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OAUTH_STATE_COOKIE_MAX_AGE_MS,
    path: "/",
}

export { getSessionMaxAge, OAUTH_STATE_COOKIE_NAME, oauthStateCookieOptions, SESSION_COOKIE_NAME, sessionCookieOptions }
