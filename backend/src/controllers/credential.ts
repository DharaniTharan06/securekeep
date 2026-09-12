import { and, eq, isNull } from "drizzle-orm"
import { db } from "../db/indexdb.js"
import { vaultItems } from "../model/vaultItem.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { parseWithSchema, vaultItemBodySchema, vaultItemIdParamsSchema } from "../utils/validation.js"

const requireAuthenticatedUserId = (userId: string | undefined): string => {
    if (!userId) {
        throw new ApiError(401, "Unauthorized request")
    }

    return userId
}

const createCredential = asyncHandler(async (req, res) => {
    const userId = requireAuthenticatedUserId(req.user?.id)
    const { encryptedPayload } = parseWithSchema(vaultItemBodySchema, req.body)

    const [vaultItem] = await db
        .insert(vaultItems)
        .values({
            userId,
            encryptedPayload,
        })
        .returning({
            id: vaultItems.id,
            encryptedPayload: vaultItems.encryptedPayload,
            createdAt: vaultItems.createdAt,
            updatedAt: vaultItems.updatedAt,
        })

    if (!vaultItem) {
        throw new ApiError(500, "Failed to create vault item")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, { vaultItem }, "Vault item created successfully"))
})

const getCredentials = asyncHandler(async (req, res) => {
    const userId = requireAuthenticatedUserId(req.user?.id)

    const userVaultItems = await db
        .select({
            id: vaultItems.id,
            encryptedPayload: vaultItems.encryptedPayload,
            createdAt: vaultItems.createdAt,
            updatedAt: vaultItems.updatedAt,
        })
        .from(vaultItems)
        .where(and(eq(vaultItems.userId, userId), isNull(vaultItems.deletedAt)))

    return res
        .status(200)
        .json(new ApiResponse(200, { vaultItems: userVaultItems }, "Vault items fetched successfully"))
})

const getCredentialById = asyncHandler(async (req, res) => {
    const userId = requireAuthenticatedUserId(req.user?.id)
    const { id } = parseWithSchema(vaultItemIdParamsSchema, req.params)

    const [vaultItem] = await db
        .select({
            id: vaultItems.id,
            encryptedPayload: vaultItems.encryptedPayload,
            createdAt: vaultItems.createdAt,
            updatedAt: vaultItems.updatedAt,
        })
        .from(vaultItems)
        .where(
            and(
                eq(vaultItems.id, id),
                eq(vaultItems.userId, userId),
                isNull(vaultItems.deletedAt)
            )
        )
        .limit(1)

    if (!vaultItem) {
        throw new ApiError(404, "Vault item not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { vaultItem }, "Vault item fetched successfully"))
})

const updateCredential = asyncHandler(async (req, res) => {
    const userId = requireAuthenticatedUserId(req.user?.id)
    const { id } = parseWithSchema(vaultItemIdParamsSchema, req.params)
    const { encryptedPayload } = parseWithSchema(vaultItemBodySchema, req.body)

    const [vaultItem] = await db
        .update(vaultItems)
        .set({
            encryptedPayload,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(vaultItems.id, id),
                eq(vaultItems.userId, userId),
                isNull(vaultItems.deletedAt)
            )
        )
        .returning({
            id: vaultItems.id,
            encryptedPayload: vaultItems.encryptedPayload,
            createdAt: vaultItems.createdAt,
            updatedAt: vaultItems.updatedAt,
        })

    if (!vaultItem) {
        throw new ApiError(404, "Vault item not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { vaultItem }, "Vault item updated successfully"))
})

const deleteCredential = asyncHandler(async (req, res) => {
    const userId = requireAuthenticatedUserId(req.user?.id)
    const { id } = parseWithSchema(vaultItemIdParamsSchema, req.params)
    const deletedAt = new Date()

    const [vaultItem] = await db
        .update(vaultItems)
        .set({
            deletedAt,
            updatedAt: deletedAt,
        })
        .where(
            and(
                eq(vaultItems.id, id),
                eq(vaultItems.userId, userId),
                isNull(vaultItems.deletedAt)
            )
        )
        .returning({
            id: vaultItems.id,
            deletedAt: vaultItems.deletedAt,
        })

    if (!vaultItem) {
        throw new ApiError(404, "Vault item not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { vaultItem }, "Vault item deleted successfully"))
})

export { createCredential, deleteCredential, getCredentialById, getCredentials, updateCredential }