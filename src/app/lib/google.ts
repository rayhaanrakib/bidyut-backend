import { OAuth2Client } from "google-auth-library";
import config from "../config";

export const googleClient = new OAuth2Client(config.google.clientId, config.google.clientSecret);
