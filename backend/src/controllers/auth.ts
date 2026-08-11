import { and, eq, isNull } from "drizzle-orm"
import type { Response } from "express"
import { db } from "../db/indexdb.js"
import { buildGoogleAuthorizationUrl, getGoogleClientId, GOOGLE_OAUTH_PROVIDER, oauthClient } from "../lib/google.js"
import { sessions } from "../model/session.js"
import { users } from "../model/user.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { getSessionMaxAge, OAUTH_STATE_COOKIE_NAME, oauthStateCookieOptions, SESSION_COOKIE_NAME, sessionCookieOptions } from "../utils/cookieOptions.js"
import { constantTimeEqual, generateToken, hashToken } from "../utils/token.js"
import { googleIdTokenPayloadSchema, googleOAuthCallbackQuerySchema, googleOAuthStateCookieSchema, parseWithSchema } from "../utils/validation.js"

const clearOAuthStateCookie = (res: Response) => {
    res.clearCookie(OAUTH_STATE_COOKIE_NAME, oauthStateCookieOptions)
}

const toSafeUser = (user: typeof users.$inferSelect) => {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        oauthProvider: user.oauthProvider,
        cryptoVersion: user.cryptoVersion,
        hasVault: user.vaultKeyEnvelope !== null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }
}

const startGoogleOAuth = asyncHandler(async (_req, res) => {
    const state = generateToken()
    const authorizationUrl = buildGoogleAuthorizationUrl(state)

    return res
        .cookie(OAUTH_STATE_COOKIE_NAME, state, oauthStateCookieOptions)
        .redirect(authorizationUrl)
})

const handleGoogleOAuthCallback = asyncHandler(async (req, res) => {
    let code: string
    let state: string
    let cookieState: string

    try {
        const parsedQuery = parseWithSchema(googleOAuthCallbackQuerySchema, req.query)
        const parsedCookies = parseWithSchema(googleOAuthStateCookieSchema, req.cookies)

        code = parsedQuery.code
        state = parsedQuery.state
        cookieState = parsedCookies[OAUTH_STATE_COOKIE_NAME]
    } catch (error) {
        clearOAuthStateCookie(res)
        throw error
    }


    clearOAuthStateCookie(res)

    if (!constantTimeEqual(cookieState, state)) {
        throw new ApiError(400, "Invalid OAuth state")
    }

    let idToken: string

    try {
        const { tokens } = await oauthClient.getToken(code)

        if (!tokens.id_token) {
            throw new ApiError(401, "Google did not return an ID token")
        }

        idToken = tokens.id_token
    } catch (error) {
        if (error instanceof ApiError) {
            throw error
        }

        throw new ApiError(401, "Google token exchange failed")
    }

    let googleProfile: ReturnType<typeof googleIdTokenPayloadSchema.parse>

    try {
        const ticket = await oauthClient.verifyIdToken({
            idToken,
            audience: getGoogleClientId(),
        })

        googleProfile = parseWithSchema(
            googleIdTokenPayloadSchema,
            ticket.getPayload()
        )
    } catch (error) {
        if (error instanceof ApiError) {
            throw error
        }

        throw new ApiError(401, "Google ID token verification failed")
    }

    const sessionRawToken = generateToken()
    const tokenHash = hashToken(sessionRawToken)
    const sessionExpiresAt = new Date(Date.now() + getSessionMaxAge())

    const authenticatedUser = await db.transaction(async (tx) => {
        const [user] = await tx
            .insert(users)
            .values({
                email: googleProfile.email,
                name: googleProfile.name,
                avatarUrl: googleProfile.picture,
                oauthProvider: GOOGLE_OAUTH_PROVIDER,
                oauthId: googleProfile.sub,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: [users.oauthProvider, users.oauthId],
                set: {
                    email: googleProfile.email,
                    name: googleProfile.name,
                    avatarUrl: googleProfile.picture,
                    updatedAt: new Date(),
                },
            })
            .returning()

        if (!user) {
            throw new ApiError(500, "Failed to authenticate user")
        }

        await tx.insert(sessions).values({
            userId: user.id,
            tokenHash,
            expiresAt: sessionExpiresAt,
        })

        return user
    })

    return res
        .status(200)
        .cookie(SESSION_COOKIE_NAME, sessionRawToken, sessionCookieOptions)
        .json(
            new ApiResponse(
                200,
                { user: toSafeUser(authenticatedUser) },
                "Google authentication successful"
            )
        )
})

const logout = asyncHandler(async (req, res) => {
    if (!req.session) {
        throw new ApiError(401, "Unauthorized request")
    }

    await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(eq(sessions.id, req.session.id))

    return res
        .status(200)
        .clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions)
        .json(new ApiResponse(200, {}, "Logged out successfully"))
})

const logoutAll = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request")
    }

    await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(
            and(
                eq(sessions.userId, req.user.id),
                isNull(sessions.revokedAt)
            )
        )

    return res
        .status(200)
        .clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions)
        .json(new ApiResponse(200, {}, "All sessions logged out successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: toSafeUser(req.user) },
                "Current user fetched successfully"
            )
        )
})

export { getCurrentUser, handleGoogleOAuthCallback, logout, logoutAll, startGoogleOAuth }
