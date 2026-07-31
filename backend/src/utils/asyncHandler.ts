import type { NextFunction, Request, RequestHandler, Response } from "express"

const asyncHandler = (
    requestHandler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch(next)
    }
}

export default asyncHandler
