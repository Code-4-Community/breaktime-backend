import { z } from "zod";

/**
 * Represents the model schema of a User
 */
export type User = {
  firstName: string;
  lastName: string;
  userID: string;
  userEmail: string;
};

// alt
// export type UserAlt = { attributes: {firstName: string, lastName}} ...
