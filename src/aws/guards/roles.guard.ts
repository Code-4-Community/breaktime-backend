import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthVerificationResponse } from '../auth.service';


/**
 * Nest guard for role-based access (i.e. groups from Cognito). Reference: https://docs.nestjs.com/guards
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    /**
     * Determines if a given request can be executed based on the roles of the requesting user.
     * @param context the execution context passed from the previous step in the pipeline. 
     * Should contain the request and user payload from AuthService. For more information, see https://docs.nestjs.com/fundamentals/execution-context
     * @returns if the endpoint can be run for the given user.
     */
    canActivate(context: ExecutionContext): boolean {
      // Get the roles defined for the endpoint that are allowed to access it.
      const allowedRoles = this.reflector.get<string[]>('roles', context.getHandler());

      // If there are no specified roles for the endpoint, allow any user to access.
      if (!allowedRoles) {
        return true;
      }

      // Get the request from the last-run step of the pipeline (in this case, the AuthMiddleware) and pull the necessary user data
      // that has been set. Keep in mind, this is not necessarily the actual user payload or JWT from the original request. Instead,
      // this is what has been set by the previous step(s).
      // In our case, this is from the Cognito groups a user is assigned.
      const request = context.switchToHttp().getRequest();
      const user: AuthVerificationResponse = request.user;

      // Check that the user belongs to at least one of the required roles
      const validUserGroups = user.groups.filter(group => allowedRoles.includes(group));

      // For testing purposes, print out the groups a user is a part of that are allowed to access this resource
      console.log(validUserGroups);
      return validUserGroups.length > 0;
    }
}
