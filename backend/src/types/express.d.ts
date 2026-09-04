import type { sessions } from "../model/session.js"
import type { users } from "../model/user.js"

type AuthenticatedUser = typeof users.$inferSelect
type AuthenticatedSession = typeof sessions.$inferSelect

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser
            session?: AuthenticatedSession
        }
    }
}

export {}
