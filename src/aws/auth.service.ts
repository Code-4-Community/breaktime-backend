import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { CognitoService } from './cognito/cognito.service';

@Injectable()
export class AuthService {
  constructor(
    private cognitoService: CognitoService,
  ) {}

  async verifyJwt(jwt: string): Promise<AuthVerificationResponse> {
    try {
      const userPayload = await this.cognitoService.validate(jwt);
      
      // grab cognito groups from the user Payload to reutrn in the verification response.
      const groups = userPayload['cognito:groups'];
    
      return {isValidated: true, groups: groups}; 
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}

export type AuthVerificationResponse = { isValidated: boolean, groups: string[] }
