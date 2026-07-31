import { OAuth2Client } from "google-auth-library";

const oauthClient = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
)

export { oauthClient }