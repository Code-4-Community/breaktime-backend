import { z } from "zod";

/**
 * The client schema of a Cognito attribute.
 * e.g : {Name: 'sub', 'value': 'aeddc72a-fe42b78a8-....'}
 */
export const CognitoAttribute = z.object({
  Name: z.string(),
  Value: z.string()
});

/**
 * Represents the client schema of a User object returned from Cognito.
 */
export const CognitoUser = z.object({
  Attributes: z.array(CognitoAttribute), // TODO : should likely expand this out to include all the known attributes we expect from cognito
  Enabled: z.boolean(),
  UserCreateDate: z.date(),
  UserLastModifiedDate: z.date(),
  UserStatus: z.string(),
  Username: z.string(),
});

/** Represents the user data returned from a token verification payload */
export type VerifiedUserInfo = { sub: string, groups: string[] }

export type CognitoUser = z.infer<typeof CognitoUser>;
