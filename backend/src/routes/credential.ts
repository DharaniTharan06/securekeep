import { Router } from "express"
import { createCredential, deleteCredential, getCredentialById, getCredentials, updateCredential } from "../controllers/credential.js"
import { verifySession } from "../middleware/auth.js"
import { apiRateLimiter } from "../middleware/rate-limiter.js"

const router = Router()

router.use(verifySession)
router.use(apiRateLimiter)

/**
 * @openapi
 * /api/v1/credentials:
 *   post:
 *     tags:
 *       - Vault Items
 *     summary: Create encrypted vault item.
 *     description: Stores an encrypted payload for the authenticated user. The backend treats the payload as opaque JSON and never inspects or decrypts it.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - encryptedPayload
 *             properties:
 *               encryptedPayload:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       201:
 *         description: Vault item created successfully.
 *       400:
 *         description: Invalid request body.
 *       401:
 *         description: Missing, expired, revoked, or invalid session.
 *   get:
 *     tags:
 *       - Vault Items
 *     summary: List encrypted vault items.
 *     description: Returns non-deleted encrypted vault items belonging to the authenticated user.
 *     responses:
 *       200:
 *         description: Vault items fetched successfully.
 *       401:
 *         description: Missing, expired, revoked, or invalid session.
 */
router.route("/")
    .post(
        createCredential
    )
    .get(
        getCredentials
    )

/**
 * @openapi
 * /api/v1/credentials/{id}:
 *   get:
 *     tags:
 *       - Vault Items
 *     summary: Get encrypted vault item by id.
 *     description: Returns one non-deleted encrypted vault item owned by the authenticated user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vault item fetched successfully.
 *       400:
 *         description: Invalid vault item id.
 *       401:
 *         description: Missing, expired, revoked, or invalid session.
 *       404:
 *         description: Vault item not found.
 *   patch:
 *     tags:
 *       - Vault Items
 *     summary: Update encrypted vault item.
 *     description: Replaces the encrypted payload for one non-deleted vault item owned by the authenticated user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - encryptedPayload
 *             properties:
 *               encryptedPayload:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Vault item updated successfully.
 *       400:
 *         description: Invalid vault item id or request body.
 *       401:
 *         description: Missing, expired, revoked, or invalid session.
 *       404:
 *         description: Vault item not found.
 *   delete:
 *     tags:
 *       - Vault Items
 *     summary: Soft delete encrypted vault item.
 *     description: Marks one vault item owned by the authenticated user as deleted using deleted_at.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vault item deleted successfully.
 *       400:
 *         description: Invalid vault item id.
 *       401:
 *         description: Missing, expired, revoked, or invalid session.
 *       404:
 *         description: Vault item not found.
 */
router.route("/:id")
    .get(
        getCredentialById
    )
    .patch(
        updateCredential
    )
    .delete(
        deleteCredential
    )

export default router
