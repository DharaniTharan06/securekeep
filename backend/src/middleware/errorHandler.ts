import type { ErrorRequestHandler } from "express"
import { ApiError } from "../utils/apiError.js"

const parserErrors: Record<string, { statusCode: number; message: string }> = {
    "entity.parse.failed": { statusCode: 400, message: "Invalid request body" },
    "entity.too.large": { statusCode: 413, message: "Request body is too large" },
    "parameters.too.many": { statusCode: 413, message: "Too many request parameters" },
    "charset.unsupported": { statusCode: 415, message: "Unsupported request charset" },
    "encoding.unsupported": { statusCode: 415, message: "Unsupported request encoding" },
    "request.aborted": { statusCode: 400, message: "Request was aborted" },
    "request.size.invalid": { statusCode: 400, message: "Invalid request body length" },
}

const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
    if (res.headersSent) {
        return next(err)
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            data: err.data,
            message: err.message,
            success: err.success,
            errors: err.errors,
        })
    }

    const parserError = typeof err === "object" && err !== null
        && "type" in err && typeof err.type === "string"
        && Object.hasOwn(parserErrors, err.type)
        ? parserErrors[err.type]
        : undefined

    if (!parserError) {
        // Database errors may contain SQL parameters; never log the raw error or request.
        console.error("Unhandled request error", { method: req.method })
    }

    const statusCode = parserError?.statusCode ?? 500

    return res.status(statusCode).json({
        statusCode,
        data: null,
        message: parserError?.message ?? "Internal server error",
        success: false,
        errors: [],
    })
}

export { errorHandler }
