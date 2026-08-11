import { Router } from "express"
import { getCurrentUser, handleGoogleOAuthCallback, logout, logoutAll, startGoogleOAuth } from "../controllers/auth.js"
import { verifySession } from "../middleware/auth.js"

const router = Router()

/**
 * @openapi
 * /api/v1/auth/google:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Start Google OAuth login.
 *     description: Creates a short-lived OAuth state cookie and redirects the user to Google's consent screen.
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth.
 *       500:
 *         description: Google OAuth environment variables are not configured.
 */
router.route("/google").get(
    startGoogleOAuth
)

/**
 * @openapi
 * /api/v1/auth/google/callback:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Complete Google OAuth login.
 *     description: Validates OAuth state, verifies the Google ID token, creates or updates the user, creates a database-backed session, and sets the raw session token in an HTTP-only cookie.
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Google authentication succeeded.
 *       400:
 *         description: Missing or invalid OAuth callback parameters.
 *       401:
 *         description: Google ID token verification failed.
 */
router.route("/google/callback").get(
    handleGoogleOAuthCallback
)

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout current session.
 *     description: Revokes the current database session and clears the session cookie.
 *     responses:
 *       200:
 *         description: Logged out successfully.
 *       401:
 *         description: Missing, expired, revoked, or invalid session.
 */
router.route("/logout").post(
    verifySession, 
    logout
)

/**
 * @openapi
 * /api/v1/auth/logout-all:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout all sessions for the current user.
 *     description: Revokes all active sessions for the authenticated user and clears the current session cookie.
 *     responses:
 *       200:
 *         description: All sessions logged out successfully.
 *       401:
 *         description: Missing, expired, revoked, or invalid session.
 */
router.route("/logout-all").post(
    verifySession, 
    logoutAll
)

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current authenticated user.
 *     description: Returns safe user profile fields for the current database-backed session.
 *     responses:
 *       200:
 *         description: Current user fetched successfully.
 *       401:
 *         description: Missing, expired, revoked, or invalid session.
 */
router.route("/me").get(
    verifySession,
    getCurrentUser
)

export default router
