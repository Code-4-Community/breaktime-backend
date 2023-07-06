import { z } from "zod";

/**
 * Represents the database schema for a company object, including list of users that belong to the company
 */
export const CompanySchema = z.object({
  CompanyID: z.string(),
  CompanyName: z.string(),
  AssociateIDs: z.array(z.string().nonempty()),
  SupervisorIDs: z.array(z.string().nonempty()),
});

/**
 * Represents the database schema for a user company object, which contains the user ID and the company IDs they belong to
 */
export const UserCompaniesSchema = z.object({
  UserID: z.string(),
  AssociateCompanyIDs: z.array(z.string()),
  SupervisorCompanyIDs: z.array(z.string()),
});

export type UserCompaniesSchema = z.infer<typeof UserCompaniesSchema>;
export type CompanySchema = z.infer<typeof CompanySchema>;
