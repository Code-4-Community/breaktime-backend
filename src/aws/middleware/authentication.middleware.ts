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
    const authHeader = req.headers['authorization'];
    if (!authHeader) return next();
    
    const token = authHeader.split(' ')[1]; // get part of string after space
    if (!token) return next();
    try {
      // This will be a AuthVerificationResponse object that contains the group data of a user
      const user = await this.authService.verifyJwt(token);

      // Set the user of the Nest request so that the next step in the pipeline (RolesGuard) can access it
      req.user = user;
    } catch (e) {
      this.logger.error(e);
      return next();
    }
    next();
  }
}
