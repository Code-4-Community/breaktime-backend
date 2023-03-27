import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { CognitoService } from './cognito/cognito.service';

@Injectable()
export class AuthService {
  constructor(
    private cognitoService: CognitoService,
  ) {}

  async verifyJwt(jwt: string): Promise<Boolean> {
    try {
      const userPayload = await this.cognitoService.validate(jwt);
    
      return true; 
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
