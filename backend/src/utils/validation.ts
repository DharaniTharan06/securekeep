import { z, type ZodType } from "zod"
import { ApiError } from "./apiError.js"
import { OAUTH_STATE_COOKIE_NAME } from "./cookieOptions.js"

const parseWithSchema = <TOutput>(
    schema: ZodType<TOutput>,
    data: unknown
): TOutput => {
    const parsed = schema.safeParse(data)

    if (parsed.success) {
        return parsed.data
    }

    const message = parsed.error.issues[0]?.message || "Invalid request data"
    throw new ApiError(400, message, parsed.error.issues)
}

const googleOAuthCallbackQuerySchema = z.object({
    code: z.string().min(1, "OAuth code is required"),
    state: z.string().min(1, "OAuth state is required"),
})

const googleOAuthStateCookieSchema = z.object({
    [OAUTH_STATE_COOKIE_NAME]: z.string().min(1, "OAuth state cookie is required"),
})

const googleIdTokenPayloadSchema = z.object({
    sub: z.string().min(1, "Google subject is required"),
    email: z.email("Google email is invalid"),
    email_verified: z.literal(true),
    name: z.string().optional(),
    picture: z.string().optional(),
})

const requireBodyField = <TBody extends Record<string, unknown>>(
    body: TBody,
    field: keyof TBody
): TBody[keyof TBody] => {
    const value = body[field]

    if (value === undefined || value === null) {
        throw new ApiError(400, `${String(field)} is required`)
    }

    if (typeof value === "string" && value.trim() === "") {
        throw new ApiError(400, `${String(field)} cannot be empty`)
    }

    return value
}

const requireRouteParam = (
    params: Record<string, string | string[] | undefined>,
    field: string
): string => {
    const value = params[field]

    if (value === undefined) {
        throw new ApiError(400, `${field} route parameter is required`)
    }

    if (Array.isArray(value)) {
        throw new ApiError(400, `${field} cannot contain multiple values`)
    }

    if (value.trim() === "") {
        throw new ApiError(400, `${field} cannot be empty`)
    }

    return value
}

export { googleIdTokenPayloadSchema, googleOAuthCallbackQuerySchema, googleOAuthStateCookieSchema, parseWithSchema, 
    requireBodyField, requireRouteParam }
