import { and, eq, gt, isNull, ne } from "drizzle-orm"
import { db } from "../db/indexdb.js"
import { sessions } from "../model/session.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "../utils/cookieOptions.js"
import { parseWithSchema, sessionIdParamsSchema } from "../utils/validation.js"

const requireAuthenticatedUserId = (userId: string | undefined): string => {
    if (!userId) {
        throw new ApiError(401, "Unauthorized request")
    }

    return userId
}

const getSessions = asyncHandler(async (req, res) => {
    const userId = requireAuthenticatedUserId(req.user?.id)

    const activeSessions = await db
        .select({
            id: sessions.id,
            expiresAt: sessions.expiresAt,
            createdAt: sessions.createdAt,
            lastUsedAt: sessions.lastUsedAt,
        })
        .from(sessions)
        .where(
            and(
                eq(sessions.userId, userId),
                isNull(sessions.revokedAt),
                gt(sessions.expiresAt, new Date())
            )
        )
    
    const sessionsWithCurrentFlag = activeSessions.map((s) => ({
        ...s,
        isCurrent: s.id === req.session?.id,
    }))

    return res
        .status(200)
        .json(new ApiResponse(200, { sessions: sessionsWithCurrentFlag }, "Sessions fetched successfully"))
})

const revokeSession = asyncHandler(async (req, res) => {
    const userId = requireAuthenticatedUserId(req.user?.id)
    const { id } = parseWithSchema(sessionIdParamsSchema, req.params)
    const revokedAt = new Date()

    const [revokedSession] = await db
        .update(sessions)
        .set({ revokedAt })
        .where(
            and(
                eq(sessions.id, id),
                eq(sessions.userId, userId),
                isNull(sessions.revokedAt)
            )
        )
        .returning({
            id: sessions.id,
        })

    if (!revokedSession) {
        throw new ApiError(404, "Session not found")
    }

    const response = res.status(200)

    if (req.session?.id === id) {
        response.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions)
    }

    return response.json(new ApiResponse(200, {}, "Session revoked successfully"))
})

const revokeOtherSessions = asyncHandler(async (req, res) => {
    const userId = requireAuthenticatedUserId(req.user?.id)

    if (!req.session) {
        throw new ApiError(401, "Unauthorized request")
    }

    await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(
            and(
                eq(sessions.userId, userId),
                ne(sessions.id, req.session.id),
                isNull(sessions.revokedAt)
            )
        )

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Other sessions revoked successfully"))
})

export { getSessions, revokeOtherSessions, revokeSession }
