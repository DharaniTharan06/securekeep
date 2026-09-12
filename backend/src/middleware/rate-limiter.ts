import type { Request, RequestHandler } from "express"
import { ApiError } from "../utils/apiError.js"

type RateLimitOptions = {
    windowMs: number
    maxRequests: number
    message: string
}

type RateLimitEntry = {
    count: number
    resetAt: number
}

const getRateLimitKey = (req: Request): string => {
    if (req.user?.id) {
        return `user:${req.user.id}`
    }

    return `ip:${req.ip || "unknown"}`
}

const createRateLimiter = (options: RateLimitOptions): RequestHandler => {
    const requests = new Map<string, RateLimitEntry>()

    setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of requests.entries()) {
            if (entry.resetAt <= now) {
                requests.delete(key)
            }
        }
    }, options.windowMs).unref()

    return (req, res, next) => {
        const now = Date.now()
        const key = getRateLimitKey(req)
        const currentEntry = requests.get(key)

        if (!currentEntry || currentEntry.resetAt <= now) {
            requests.set(key, {
                count: 1,
                resetAt: now + options.windowMs,
            })

            return next()
        }

        currentEntry.count += 1

        if (currentEntry.count > options.maxRequests) {
            const retryAfterSeconds = Math.ceil((currentEntry.resetAt - now) / 1000)

            res.setHeader("Retry-After", retryAfterSeconds.toString())
            throw new ApiError(429, options.message)
        }

        return next()
    }
}

const authRateLimiter = createRateLimiter({
    windowMs: 1000 * 60 * 10,
    maxRequests: 20,
    message: "Too many authentication attempts. Please try again later.",
})

const apiRateLimiter = createRateLimiter({
    windowMs: 1000 * 60,
    maxRequests: 120,
    message: "Too many requests. Please try again later.",
})

export { apiRateLimiter, authRateLimiter }
