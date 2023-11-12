import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Creates a custom decorator that returns the request's user data based on the NestJS pipeline (e.g. authorization, roles guard, etc.)
 */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);