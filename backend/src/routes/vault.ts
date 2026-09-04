import { Router } from "express"
import { getVaultEnvelope, getVaultStatus, setupVault, updateVaultEnvelope } from "../controllers/vault.js"
import { verifySession } from "../middleware/auth.js"

const router = Router()

router.use(verifySession)

/**
 * @openapi
 * /api/v1/vault/status:
 *   get:
 *     tags:
 *       - Vault
 *     summary: Get vault initialization status.
 *     description: Returns whether the authenticated user has a vault key envelope without returning the envelope itself.
 *     responses:
 *       200:
 *         description: Vault status fetched successfully.
 *       401:
 *         description: Missing, expired, revoked, or invalid session.
 */
router.route("/status").get(
    getVaultStatus
)

/**
 * @openapi
 * /api/v1/vault/setup:
 *   post:
 *     tags:
 *       - Vault
 *     summary: Initialize the authenticated user's vault.
 *     description: Stores the supplied encrypted vault key envelope as an opaque JSON object. The backend does not inspect or decrypt it.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vaultKeyEnvelope
 *             properties:
 *               vaultKeyEnvelope:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       201:
 *         description: Vault initialized successfully.
 *       401:
 *         description: Missing, expired, revoked, or invalid session.
 *       409:
 *         description: Vault is already initialized.
 */
router.route("/setup").post(
    setupVault
)

/**
 * @openapi
 * /api/v1/vault/envelope:
 *   get:
 *     tags:
 *       - Vault
 *     summary: Get the authenticated user's vault key envelope.
 *     description: Returns the encrypted vault key envelope exactly as stored. The backend does not inspect or decrypt it.
 *     responses:
 *       200:
 *         description: Vault envelope fetched successfully.
 *       401:
 *         description: Missing, expired, revoked, or invalid session.
 *       404:
 *         description: Vault is not initialized.
 *   patch:
 *     tags:
 *       - Vault
 *     summary: Replace the authenticated user's vault key envelope.
 *     description: Stores a new encrypted vault key envelope exactly as supplied. The backend does not inspect or decrypt it.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vaultKeyEnvelope
 *             properties:
 *               vaultKeyEnvelope:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Vault envelope updated successfully.
 *       401:
 *         description: Missing, expired, revoked, or invalid session.
 *       404:
 *         description: Vault is not initialized.
 */
router.route("/envelope")
    .get(
        getVaultEnvelope
    )
    .patch(
        updateVaultEnvelope
    )

export default router
