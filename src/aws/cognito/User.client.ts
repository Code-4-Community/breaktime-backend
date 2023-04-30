import { z } from "zod";

/**
 * Represents the client schema of a User object returned from Cognito.
 */
export const CognitoUser = z.object({
  Attributes: z.array(z.any()),
  Enabled: z.boolean(),
  UserCreateDate: z.date(),
  UserLastModifiedData: z.date(),
  UserStatus: z.string(),
  Username: z.string(),
});

export type CognitoUser = z.infer<typeof CognitoUser>;
