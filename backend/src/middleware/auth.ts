import { and, eq, gt, isNull } from "drizzle-orm"
import { db } from "../db/indexdb.js"
import { sessions } from "../model/session.js"
import { users } from "../model/user.js"
import { ApiError } from "../utils/apiError.js"
import { hashToken } from "../utils/token.js"
import { SESSION_COOKIE_NAME } from "../utils/cookieOptions.js"
import asyncHandler from "../utils/asyncHandler.js"

const verifySession = asyncHandler(async (req, res, next) => {
    const rawSessionToken = req.cookies?.[SESSION_COOKIE_NAME]

    if (typeof rawSessionToken !== "string" || rawSessionToken.trim() === "") {
        throw new ApiError(401, "Unauthorized request")
    }

    const tokenHash = hashToken(rawSessionToken)

    const [sessionWithUser] = await db
        .select({
            session: sessions,
            user: users,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(
            and(
                eq(sessions.tokenHash, tokenHash),
                isNull(sessions.revokedAt),
                gt(sessions.expiresAt, new Date())
            )
        )
        .limit(1)

    if (!sessionWithUser) {
        throw new ApiError(401, "Invalid or expired session")
    }

    const lastUsedAt = new Date()

    await db
        .update(sessions)
        .set({ lastUsedAt })
        .where(eq(sessions.id, sessionWithUser.session.id))

    req.user = sessionWithUser.user
    req.session = {
        ...sessionWithUser.session,
        lastUsedAt,
    }

    next()
})

export { verifySession }
