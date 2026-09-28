import type { CookieOptions } from "express"
import ms, { StringValue } from "ms"

const SESSION_COOKIE_NAME = "session_token"
const OAUTH_STATE_COOKIE_NAME = "oauth_state"
const DEFAULT_SESSION_EXPIRY = "7d"
const OAUTH_STATE_COOKIE_MAX_AGE_MS = 1000 * 60 * 10

const getSessionMaxAge = (): number => {
    const sessionExpiry = process.env.SESSION_EXPIRY ?? DEFAULT_SESSION_EXPIRY
    let maxAge: number | undefined

    try {
        maxAge = ms(sessionExpiry as StringValue)
    } catch {
        throw new Error("SESSION_EXPIRY must be a valid positive duration, for example 7d")
    }

    if (typeof maxAge !== "number" || !Number.isSafeInteger(maxAge) || maxAge <= 0
        || !Number.isFinite(new Date(Date.now() + maxAge).getTime())) {
        throw new Error("SESSION_EXPIRY must be a valid positive duration, for example 7d")
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
