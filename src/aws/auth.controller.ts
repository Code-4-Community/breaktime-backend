import { Controller, Get } from '@nestjs/common';
// import { ApiTags } from '@nestjs/swagger';
// import { Role } from '../user/types/role';
// import { User } from '../user/types/user.entity';
import { AuthService } from './auth.service';
// import { Auth } from './decorators/auth.decorator';
// import { ReqUser } from './decorators/user.decorator';

// @ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Must be authenticated. Returns the User making the request.
   */
  @Get('me')
  // @Auth(Role.ADMIN, Role.RESEARCHER)
  // me(@ReqUser() user: User): User {
  //   return user;
  // }
  me() : String {
    return "Auth endpoint was served "; 
  }
}
