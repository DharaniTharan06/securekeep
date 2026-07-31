import { db } from "../db/indexdb.js"
import { users } from "../model/user.js"
import { sessions } from "../model/session.js";
import { eq, and } from "drizzle-orm";
import ms, { StringValue } from "ms";
import { CookieOptions } from "express"
import { oauthClient } from "../lib/google.js"
import { generateToken, hashToken } from "../utils/token.js"
import { ApiError } from "../utils/apiError.js"
import asyncHandler from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/apiResponse.js";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "../utils/cookieOptions.js";

const oauth_state_name = "oauth_state"

const oauthStateCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 10,
    path: "/",
}

const startGoogleOAuth = asyncHandler(async (req, res) => {
    
    const scopes = ["openid","email","profile"]

    const state = generateToken() 

    const authorizationurl = oauthClient.generateAuthUrl({
        scope: scopes,
        prompt: 'select_account',
        state
    })

    return res
    .cookie(oauth_state_name, state, oauthStateCookieOptions) 
    .redirect( authorizationurl )
})

const handleGoogleOAuthCallback = asyncHandler(async (req, res) => {
    const { code, state } = req.query
    const cookiestate = req.cookies[oauth_state_name]

    if(!code || !state || !cookiestate || Array.isArray(code) || Array.isArray(state)){
        res.clearCookie(oauth_state_name,oauthStateCookieOptions)
        throw new ApiError(400,"Bad request")
    }
    if(cookiestate.toString() !== state?.toString()){
        res.clearCookie(oauth_state_name,oauthStateCookieOptions)
        throw new ApiError(400,"Bad request")
    }

    res.clearCookie(oauth_state_name,oauthStateCookieOptions)

    const { tokens } = await oauthClient.getToken(code as string)
    if(!tokens.id_token){
        throw new ApiError(401,"No Id token returned")
    }

    const ticket = await oauthClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.CLIENT_ID
    })

    const payload = ticket.getPayload()
    if(!payload || !payload.email || payload.email_verified !== true){
        throw new ApiError(401,"Invalid Id token")
    }

    const email = payload.email

    const result = await db.transaction(async (tx) => {
        let user = (
            await tx
            .select()
            .from(users)
            .where(
                and(
                    eq(users.oauthProvider,"google"),
                    eq(users.oauthId,payload.sub)
                )
            )
            .limit(1)
        )[0]

        let existinguser = true

        if (!user) {

            existinguser = false

            const insertedUser = await tx
                .insert(users)
                .values({
                    email: email,
                    name: payload.name,
                    avatarUrl: payload.picture,
                    oauthProvider: "google",
                    oauthId: payload.sub
                })
                .returning()

            user = insertedUser[0]

            if (!user) {
                throw new ApiError(500, "Failed to create user")
            }
        }

        const sessionrawtoken = generateToken()
        const sessiontoken = hashToken(sessionrawtoken)

        const expiryms = ms(process.env.SESSION_EXPIRY as StringValue)

        const insertedSession = await tx
            .insert(sessions)
            .values({
                userId: user.id,
                tokenHash: sessiontoken,
                expiresAt: new Date(Date.now() + expiryms)
            })
            .returning()

        if (!insertedSession[0]) {
            throw new ApiError(500, "Failed to create session")
        }

        return { user, sessionrawtoken, existinguser }
    })

    const {user, sessionrawtoken, existinguser} = result

    const safeUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
    }

    return res
    .status(200)
    .cookie(SESSION_COOKIE_NAME,sessionrawtoken,sessionCookieOptions)
    .json(new ApiResponse(
        200,
        {
            user: safeUser
        },
        existinguser?"User logged in":"User created and logged in"
    ))
})

const logout = asyncHandler(async (req, res) => {
    // TODO: logout current session
    throw new ApiError(501, "TODO: logout current session")
})

const logoutAll = asyncHandler(async (req, res) => {
    // TODO: logout all sessions for current user
    throw new ApiError(501, "TODO: logout all sessions")
})

const getCurrentUser = asyncHandler(async (req, res) => {
    // TODO: get current authenticated user
    throw new ApiError(501, "TODO: get current user")
})

export { getCurrentUser, handleGoogleOAuthCallback, logout, logoutAll, startGoogleOAuth, oauth_state_name, oauthStateCookieOptions}
