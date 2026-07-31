import { ApiError } from "./apiError.js"

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

export { requireBodyField, requireRouteParam }