import { randomBytes, createHash } from 'node:crypto'

const generateToken = (byteLength = 32): string => {

    const rawToken = randomBytes(byteLength).toString('base64url')
    return rawToken
}

const hashToken = (token: string): string => {
    
    const hash = createHash('sha256')
    .update(token)
    .digest('hex')

    return hash
}

export { generateToken, hashToken }
