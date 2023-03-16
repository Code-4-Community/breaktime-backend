import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { AuthService } from '../auth.service';

/**
 * Authenticates a request if it provides an auth token.
 */
@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  private logger = new Logger(AuthenticationMiddleware.name);

  constructor(private authService: AuthService) {}

  async use(req: any, res: any, next: () => void) {
    console.log("Authentication middleware.ts callback is here"); 
    
    const authHeader = req.headers['authorization'];
    if (!authHeader) return next();
    
    const token = authHeader.split(' ')[1]; // get part of string after space
    if (!token) return next();
    try {
      const user = await this.authService.verifyJwt(token);
      req.user = user;
    } catch (e) {
      this.logger.error(e);
      return next();
    }
    next();
  }
}
