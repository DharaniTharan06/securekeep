import type { ErrorRequestHandler } from "express"
import { ApiError } from "../utils/apiError.js"

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            data: err.data,
            message: err.message,
            success: err.success,
            errors: err.errors,
        })
    }

    return res.status(500).json({
        statusCode: 500,
        data: null,
        message: err instanceof Error ? err.message : "Internal server error",
        success: false,
        errors: [],
    })
}

export { errorHandler }
