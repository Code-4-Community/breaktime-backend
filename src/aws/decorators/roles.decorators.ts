import { SetMetadata } from "@nestjs/common";

/**
 * A custom decorator that allows us to take in a set of groups or roles and process them in the Nest pipeline (i.e. RolesGuard).
 */
export const Roles = (...roles: string[]) => SetMetadata("roles", roles);
