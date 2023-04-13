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
      console.log(userPayload);
      // TODO grab cognito groups from the user Payload, may want a secondary parent function that
      // both authenticates the jwt and any user/group specifications
      const groups = userPayload['cognito:groups'];
      console.log(groups);
    
      return {isValidated: true, groups: groups}; 
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}

export type AuthVerificationResponse = { isValidated: boolean, groups: string[] }
