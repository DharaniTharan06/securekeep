import { OAuth2Client } from "google-auth-library";
import { ApiError } from "../utils/apiError.js";

const GOOGLE_OAUTH_PROVIDER = "google"
const GOOGLE_OAUTH_SCOPES = ["openid", "email", "profile"]

const getRequiredEnv = (key: string): string => {
    const value = process.env[key]

    if (!value) {
        throw new ApiError(500, `${key} is not configured`)
    }

    return value
}

const getGoogleClientId = (): string => {
    return getRequiredEnv("CLIENT_ID")
}

const assertGoogleOAuthConfig = () => {
    getRequiredEnv("CLIENT_ID")
    getRequiredEnv("CLIENT_SECRET")
    getRequiredEnv("REDIRECT_URI")
}

const oauthClient = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
)

const buildGoogleAuthorizationUrl = (state: string): string => {

    return oauthClient.generateAuthUrl({
        scope: GOOGLE_OAUTH_SCOPES,
        prompt: "select_account",
        state,
    })
}

export { buildGoogleAuthorizationUrl, getGoogleClientId, GOOGLE_OAUTH_PROVIDER, oauthClient, assertGoogleOAuthConfig }