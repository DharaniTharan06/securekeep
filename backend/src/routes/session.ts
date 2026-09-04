import { Router } from "express"
import { getSessions, revokeOtherSessions, revokeSession } from "../controllers/session.js"
import { verifySession } from "../middleware/auth.js"

const router = Router()

router.use(verifySession)

/**
 * @openapi
 * /api/v1/sessions:
 *   get:
 *     tags:
 *       - Sessions
 *     summary: List active sessions.
 *     description: Returns active, non-revoked sessions for the authenticated user without exposing token hashes.
 *     responses:
 *       200:
 *         description: Sessions fetched successfully.
 *       401:
 *         description: Missing, expired, revoked, or invalid session.
 *   delete:
 *     tags:
 *       - Sessions
 *     summary: Revoke other sessions.
 *     description: Revokes every active session for the authenticated user except the current session.
 *     responses:
 *       200:
 *         description: Other sessions revoked successfully.
 *       401:
 *         description: Missing, expired, revoked, or invalid session.
 */
router.route("/")
    .get(
        getSessions
    )
    .delete(
        revokeOtherSessions
    )

/**
 * @openapi
 * /api/v1/sessions/{id}:
 *   delete:
 *     tags:
 *       - Sessions
 *     summary: Revoke one session.
 *     description: Revokes one session owned by the authenticated user. If it is the current session, the session cookie is cleared.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Session revoked successfully.
 *       400:
 *         description: Invalid session id.
 *       401:
 *         description: Missing, expired, revoked, or invalid session.
 *       404:
 *         description: Session not found.
 */
router.route("/:id").delete(
    revokeSession
)

export default router
