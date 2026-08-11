import { createHash, randomBytes, timingSafeEqual } from "node:crypto"

const generateToken = (byteLength = 32): string => {
    return randomBytes(byteLength).toString("base64url")
}

const hashToken = (token: string): string => {
    return createHash("sha256").update(token).digest("hex")
}

const constantTimeEqual = (firstValue: string, secondValue: string): boolean => {
    const firstBuffer = Buffer.from(firstValue)
    const secondBuffer = Buffer.from(secondValue)

    if (firstBuffer.length !== secondBuffer.length) {
        return false
    }

    return timingSafeEqual(firstBuffer, secondBuffer)
}

export { constantTimeEqual, generateToken, hashToken }
