import { and, eq, isNotNull, isNull } from "drizzle-orm"
import { db } from "../db/indexdb.js"
import { users } from "../model/user.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { parseWithSchema, vaultEnvelopeBodySchema } from "../utils/validation.js"

const requireAuthenticatedUserId = (userId: string | undefined): string => {
    if (!userId) {
        throw new ApiError(401, "Unauthorized request")
    }

    return userId
}

const getVaultStatus = asyncHandler(async (req, res) => {
    const userId = requireAuthenticatedUserId(req.user?.id)

    const [user] = await db
        .select({
            vaultKeyEnvelope: users.vaultKeyEnvelope,
            cryptoVersion: users.cryptoVersion,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                hasVault: user.vaultKeyEnvelope !== null,
                cryptoVersion: user.cryptoVersion,
            },
            "Vault status fetched successfully"
        )
    )
})

const setupVault = asyncHandler(async (req, res) => {
    const userId = requireAuthenticatedUserId(req.user?.id)
    const { vaultKeyEnvelope } = parseWithSchema(vaultEnvelopeBodySchema, req.body)

    const [updatedUser] = await db
        .update(users)
        .set({
            vaultKeyEnvelope,
            updatedAt: new Date(),
        })
        .where(and(eq(users.id, userId), isNull(users.vaultKeyEnvelope)))
        .returning({
            cryptoVersion: users.cryptoVersion,
        })

    if (!updatedUser) {
        throw new ApiError(409, "Vault is already initialized")
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                hasVault: true,
                cryptoVersion: updatedUser.cryptoVersion,
            },
            "Vault initialized successfully"
        )
    )
})

const getVaultEnvelope = asyncHandler(async (req, res) => {
    const userId = requireAuthenticatedUserId(req.user?.id)

    const [user] = await db
        .select({
            vaultKeyEnvelope: users.vaultKeyEnvelope,
            cryptoVersion: users.cryptoVersion,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if (user.vaultKeyEnvelope === null) {
        throw new ApiError(404, "Vault is not initialized")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                vaultKeyEnvelope: user.vaultKeyEnvelope,
                cryptoVersion: user.cryptoVersion,
            },
            "Vault envelope fetched successfully"
        )
    )
})

const updateVaultEnvelope = asyncHandler(async (req, res) => {
    const userId = requireAuthenticatedUserId(req.user?.id)
    const { vaultKeyEnvelope } = parseWithSchema(vaultEnvelopeBodySchema, req.body)

    const [updatedUser] = await db
        .update(users)
        .set({
            vaultKeyEnvelope,
            updatedAt: new Date(),
        })
        .where(and(eq(users.id, userId), isNotNull(users.vaultKeyEnvelope)))
        .returning({
            cryptoVersion: users.cryptoVersion,
        })

    if (!updatedUser) {
        throw new ApiError(404, "Vault is not initialized")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                hasVault: true,
                cryptoVersion: updatedUser.cryptoVersion,
            },
            "Vault envelope updated successfully"
        )
    )
})

export { getVaultEnvelope, getVaultStatus, setupVault, updateVaultEnvelope }
