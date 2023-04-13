import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';


// TODO : currently allows all roles to access
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
      const roles = this.reflector.get<string[]>('roles', context.getHandler());
      /*if (!roles) {
        return true;
      }*/

      const request = context.switchToHttp().getRequest();
      const user = request.user;
      console.log(user);
      if (user.groups.length != 0) {
        return true;
      }
      return false; // TODO : will need to match roles
    }
}
