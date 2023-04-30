import { z } from "zod";

/**
 * Represents the model schema of a User
 */
// {String "givenName", String "lastName", String "userID", String "userEmail"}
export type User = { givenName: string, lastName: string, userID: string, userEmail: string };